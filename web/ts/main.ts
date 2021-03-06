/// <reference path="./client.ts"/>
/// <reference path="./pager.ts"/>
/// <reference path="./cookie.ts"/>
/// <reference path="./pages/login.ts"/>
/// <reference path="./pages/certs.ts"/>
/// <reference path="./color.ts"/>

//Because Lens.js adds template to $()
interface JQuery {
	template(template: string, options?: object): any;
}

let NORMAL_HAMBURGER_WIDTH;
let NORMAL_HAMBURGER_HEIGHT;
let HAMBURGER_BOX_PADDING;

$(document).ready(function () {
	let hamburgerBox = $('#hamburger-box');
	NORMAL_HAMBURGER_WIDTH = hamburgerBox.width();
	NORMAL_HAMBURGER_HEIGHT = $('#hamburger').height();
	HAMBURGER_BOX_PADDING = hamburgerBox.innerWidth() - NORMAL_HAMBURGER_WIDTH;

	let doomsday = new Doomsday();
	let pager = new Pager(doomsday);

	doomsday.fetchAuthType()
		.then(authType => {
			if (authType == AuthMethod.NONE) {
				let logout_button = $('#logout-button');
				logout_button.addClass('hamburger-menu-button-inactive');
				logout_button.removeClass('navbar-button hamburger-menu-button');
				logout_button.mouseover(function () { logout_button.text('auth is turned off'); });
				logout_button.mouseout(function () { logout_button.text('logout'); });
			} else {
				$('#logout-button').click(function () {
					closeHamburgerMenu();
					deleteCookie('doomsday-token');
					pager.display(new LoginPage());
				});
			}
			if (authType == AuthMethod.USERPASS && getCookie('doomsday-token') == "") {
				pager.display(new LoginPage());
			} else {
				pager.display(new DashboardPage());
			}
		})
		.catch((e: APIError) => {
			console.log(`Something went wrong: ${e.errorMessage}`);
		});
});

const FRAMERATE = 42;
const FRAME_INTERVAL = 1000 / FRAMERATE;

const NO_ANIM = -1;

let hamburgerMenuOpen = false;

let currentHamburgerMenuOpenness = 0;

function setHamburgerMenuOpenness(percentage: number) {
	let menu = $('#hamburger-menu');
	//The +1 is for the 1px wide border
	let menuWidth = menu.innerWidth() + 1;
	let desiredShift = menuWidth * percentage;

	menu.css('left', (-menuWidth + desiredShift) + "px");

	let boxWidth = Math.max(desiredShift - (1 + HAMBURGER_BOX_PADDING), NORMAL_HAMBURGER_WIDTH);
	let boxHeight = NORMAL_HAMBURGER_HEIGHT - (percentage * (NORMAL_HAMBURGER_HEIGHT * 0.1));
	$('#hamburger-box').css('width', boxWidth + "px");
	$('#hamburger').css('height', boxHeight + "px");
	currentHamburgerMenuOpenness = percentage;
}

let menuOpenAnimID = NO_ANIM;

function hamburgerMenuSlide(start: number, end: number) {
	if (menuOpenAnimID != NO_ANIM) {
		clearInterval(menuOpenAnimID);
	}
	let duration = 0.2; //in seconds
	let totalDelta = end - start;
	let lastAnimTime = new Date().getTime();
	return function () {
		let now = new Date().getTime();
		let timeDelta = now - lastAnimTime;
		let updatePercentage = (duration * 1000) / timeDelta;
		let frameDelta = totalDelta / updatePercentage;
		lastAnimTime = now;

		let desiredOpenness = currentHamburgerMenuOpenness + frameDelta;
		if ((totalDelta >= 0 && desiredOpenness >= end) || (totalDelta < 0 && desiredOpenness <= end)) {
			desiredOpenness = end;
			clearInterval(menuOpenAnimID);
			menuOpenAnimID = NO_ANIM;
		}

		setHamburgerMenuOpenness(desiredOpenness);
	};
}

function openHamburgerMenu() {
	menuOpenAnimID = setInterval(hamburgerMenuSlide(0, 1), FRAME_INTERVAL);
	hamburgerMenuOpen = true;
}

function closeHamburgerMenu() {
	menuOpenAnimID = setInterval(hamburgerMenuSlide(1, 0), FRAME_INTERVAL);
	hamburgerMenuOpen = false;
}

function toggleHamburgerMenu() {
	if (hamburgerMenuOpen) {
		closeHamburgerMenu();
	} else {
		openHamburgerMenu();
	}
}

$('#hamburger-box').click(function () {
	toggleHamburgerMenu();
});