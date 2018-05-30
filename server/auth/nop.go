package auth

import "net/http"

//AuthNop is the identifier returned by Nop.Identifier
const AuthNop = "None"

type Nop struct{}

func (_ Nop) Configure(map[string]string) error { return nil }
func (_ Nop) LoginHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotImplemented)
		w.Write([]byte("This doomsday server does not have authentication configured"))
	}
}

func (_ Nop) TokenHandler() TokenFunc {
	return func(fn http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			fn(w, r)
		}
	}
}

func (_ Nop) Identifier() string {
	return AuthNop
}