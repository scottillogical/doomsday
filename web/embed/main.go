package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"sort"
	"strings"
	"text/template"

	yaml "gopkg.in/yaml.v2"
)

const (
	tmpl = `package server

type staticFile struct {
	Content string
	MIMEType string
}

// This file is autogenerated by go generate. Do not modify.
var webStatics = map[string]staticFile{ {{range .}}
	"{{.Path}}": ` + "{ Content: `{{.Content}}`, MIMEType: `{{.MIMEType}}` }," + `{{end}}
}
`
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "Must give mappings file as argument.")
		os.Exit(1)
	}

	mappingsFilePath := os.Args[1]
	mappingsFile, err := os.Open(mappingsFilePath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Could not open mappings file `%s'\n", mappingsFilePath)
		os.Exit(1)
	}

	type mappingsFileEntry struct {
		ServePath string `yaml:"servePath"`
		MIMEType  string `yaml:"mimeType"`
	}

	mappings := map[string]mappingsFileEntry{}
	yamlDecoder := yaml.NewDecoder(mappingsFile)
	err = yamlDecoder.Decode(&mappings)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Could not decode mappings file `%s' as YAML: %s\n", mappingsFilePath, err)
		os.Exit(1)
	}

	type staticFile struct {
		Path     string
		Content  string
		MIMEType string
	}
	staticFiles := []staticFile{}
	for filepathToRead, value := range mappings {
		f, err := os.Open(filepathToRead)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Could not open static file `%s'\n", filepathToRead)
			os.Exit(1)
		}

		fileContentsBytes, err := ioutil.ReadAll(f)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Could not read static file `%s'\n", filepathToRead)
			os.Exit(1)
		}

		fileContentsFiltered := strings.ReplaceAll(string(fileContentsBytes), "`", "` + \"`\" + `")
		staticFiles = append(staticFiles, staticFile{
			Path:     value.ServePath,
			MIMEType: value.MIMEType,
			Content:  fileContentsFiltered,
		})
	}

	//Make sure the static files get written in a determinstic order
	sort.Slice(staticFiles, func(i, j int) bool { return staticFiles[i].Path < staticFiles[j].Path })

	t := template.Must(template.New("genstaticmap").Parse(tmpl))

	outputFile, err := os.Create("server/static.go")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Could not create output file: %s\n", err)
		os.Exit(1)
	}

	err = t.Execute(outputFile, staticFiles)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Could not execute template: %s\n", err)
		os.Exit(1)
	}
}
