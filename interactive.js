
// ==========================================
// SKYFLY - FLIGHT BOOKING SYSTEM
// Vanilla JavaScript
// ==========================================

const CITY = {
    CGK: "Jakarta",
    DPS: "Bali",
    SUB: "Surabaya",
    YIA: "Yogyakarta",
    KNO: "Medan",
    UPG: "Makassar"
};

const FACTOR = {
    CGK: 1,
    DPS: 1,
    SUB: 0.7,
    YIA: 0.6,
    KNO: 1.4,
    UPG: 1.5
};

const AIRLINES = [
    {
        name: "Garuda Indonesia",
        tag: "The Airline of Indonesia",
        dep: 480,
        mins: 135,
        price: 1235000,
        code: "GA",
        color: "#087da8",
        logo: "img/garuda.png"
    },
    {
        name: "Lion Air",
        tag: "We make people fly",
        dep: 570,
        mins: 140,
        price: 1150000,
        code: "JT",
        color: "#e11d2e",
        logo: "img/lion.png"
    },
    {
        name: "Batik Air",
        tag: "Fly with Style",
        dep: 680,
        mins: 145,
        price: 1180000,
        code: "ID",
        color: "#c1121f",
        logo: "img/batik.png"
    }
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const $ = selector => document.querySelector(selector);

const $$ = selector => [...document.querySelectorAll(selector)];

const pad = number => String(number).padStart(2, "0");

const hm = minutes =>
    pad(Math.floor(minutes / 60) % 24) +
    ":" +
    pad(minutes % 60);

const rp = number =>
    "Rp " + number.toLocaleString("id-ID");

const iso = date =>
    date.getFullYear() + "-" +
    pad(date.getMonth() + 1) + "-" +
    pad(date.getDate());

const day = value => {
    const [y, m, d] = value.split("-").map(Number);

    return new Date(y, m - 1, d).toLocaleDateString(
        "en-US",
        {
            weekday: "short",
            month: "short",
            day: "numeric"
        }
    );
};

const esc = value =>
    String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

// ==========================================
// LOCAL STORAGE
// ==========================================

const KEY = "skyfly.bookings";

function loadBookings() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
        return [];
    }
}

function saveBookings(bookings) {
    try {
        localStorage.setItem(KEY, JSON.stringify(bookings));
    } catch {
        toast("Unable to save booking.");
    }
}

// ==========================================
// GLOBAL VARIABLES
// ==========================================

let trip = "round";
let deals = [];
let selectedDeal = null;

const dlg = $("#dlg");

// ==========================================
// TOAST NOTIFICATION
// ==========================================

let toastTimer;

function toast(message) {
    const element = $("#toast");

    element.textContent = message;
    element.hidden = false;

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        element.hidden = true;
    }, 2600);
}

// ==========================================
// INITIAL SETUP
// ==========================================

function setup() {

    // Populate cities

    const cities = Object.entries(CITY)
        .map(([code, name]) =>
            `<option value="${code}">${name} (${code})</option>`
        )
        .join("");

    $("#from").innerHTML = cities;
    $("#to").innerHTML = cities;

    $("#from").value = "CGK";
    $("#to").value = "DPS";

    // Passenger options

    $("#pax").innerHTML = [1, 2, 3, 4, 5]
        .map(number =>
            `<option value="${number}">
                ${number} Adult${number > 1 ? "s" : ""}
            </option>`
        )
        .join("");

    // Date setup

    const today = new Date();

    const addDays = number => {
        const date = new Date(today);
        date.setDate(date.getDate() + number);
        return iso(date);
    };

    $("#dep").min = addDays(0);
    $("#dep").value = addDays(1);

    $("#ret").min = addDays(1);
    $("#ret").value = addDays(5);

    renderDeals();
}

// ==========================================
// RENDER FLIGHT DEALS
// ==========================================

function renderDeals() {

    const from = $("#from").value;
    const to = $("#to").value;
    const pax = Number($("#pax").value);
    const departureDate = day($("#dep").value);

    const factor = (FACTOR[from] + FACTOR[to]) / 2;

    deals = AIRLINES.map(airline => {

        const mins = Math.round(
            airline.mins * (0.6 + 0.4 * factor)
        );

        const total = Math.round(
            airline.price * factor * pax / 5000
        ) * 5000;

        return {
            ...airline,
            from,
            to,
            date: departureDate,
            mins,
            arr: airline.dep + mins,
            total,
            pax
        };
    });

    $("#deal-list").innerHTML = deals.map((deal, index) => `

        <div class="deal">

            <div class="air">
                <img class="logo-b"
                    src="${deal.logo}"
                    alt="${esc(deal.name)}"
                >

                <div>
                    <b>${esc(deal.name)}</b>
                    <small>${esc(deal.tag)}</small>
                </div>
            </div>

            <div>
                <b>${deal.from} → ${deal.to}</b>
                <small>${CITY[deal.from]} → ${CITY[deal.to]}</small>
            </div>

            <div>
                <b>${hm(deal.dep)}</b>
                <small>${deal.date}</small>
            </div>

            <div class="dur">
                ◷ ${Math.floor(deal.mins / 60)}h
                ${pad(deal.mins % 60)}m
            </div>

            <div>
                <b>${hm(deal.arr)}</b>
                <small>${deal.date}</small>
            </div>

            <div class="price">
                ${rp(deal.total)}
            </div>

            <button class="book" data-i="${index}">
                Book Now
            </button>

        </div>

    `).join("");
}

// ==========================================
// SEARCH FLIGHTS
// ==========================================

function searchFlights() {

    const message = $("#msg");

    if ($("#from").value === $("#to").value) {
        message.textContent =
            "Kota asal dan tujuan tidak boleh sama.";

        message.hidden = false;
        return;
    }

    if (
        !$("#dep").value ||
        $("#dep").value < $("#dep").min
    ) {
        message.textContent =
            "Pilih tanggal keberangkatan yang valid.";

        message.hidden = false;
        return;
    }

    if (
        trip === "round" &&
        (
            !$("#ret").value ||
            $("#ret").value < $("#dep").value
        )
    ) {
        message.textContent =
            "Tanggal kembali harus setelah tanggal berangkat.";

        message.hidden = false;
        return;
    }

    message.hidden = true;

    renderDeals();

    $("#deals").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    toast("Flight search completed!");
}

// ==========================================
// OPEN BOOKING FORM
// ==========================================

function openBook(deal) {

    selectedDeal = deal;

    $("#dlg-body").innerHTML = `

        <h2>Confirm Booking</h2>

        <div class="sum">

            <b>${esc(deal.name)}</b>

            <br>

            ${deal.from} → ${deal.to}

            <br>

            ${deal.date}

            | ${hm(deal.dep)} - ${hm(deal.arr)}

            <br>

            ${deal.pax} passenger${deal.pax > 1 ? "s" : ""}

            <br>

            <b class="price">${rp(deal.total)}</b>

        </div>

        <form id="bk">

            <label>
                Passenger Name

                <input
                    name="name"
                    type="text"
                    required
                    minlength="3"
                    placeholder="As written on ID"
                >
            </label>

            <label>
                Email Address

                <input
                    name="email"
                    type="email"
                    required
                    placeholder="example@email.com"
                >
            </label>

            <div class="acts">

                <button
                    type="button"
                    class="ghost"
                    data-close
                >
                    Cancel
                </button>

                <button class="go" type="submit">
                    Confirm Booking
                </button>

            </div>

        </form>

    `;

    dlg.showModal();
}

// ==========================================
// CONFIRM BOOKING
// ==========================================

function confirmBook(form, deal) {

    if (!deal) return;

    const characters =
        "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    const code = Array.from(
        { length: 6 },
        () => characters[
            Math.floor(Math.random() * characters.length)
        ]
    ).join("");

    const booking = {
        code,
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),

        from: deal.from,
        to: deal.to,

        date: deal.date,
        time: hm(deal.dep),

        airline: deal.name,
        pax: deal.pax,
        total: deal.total,

        status: "Confirmed"
    };

    const bookings = loadBookings();

    bookings.unshift(booking);

    saveBookings(bookings);

    // Confirmation screen

    $("#dlg-body").innerHTML = `

        <div class="done">

            <div class="tick">✓</div>

            <h2>Booking Confirmed!</h2>

            <p>Your booking code</p>

            <div class="code">${code}</div>

            <p>
                ${deal.from} → ${deal.to}
                <br>
                ${deal.date} | ${hm(deal.dep)}
            </p>

            <p class="muted">
                Your booking has been saved successfully.
            </p>

            <div class="acts">

                <button
                    type="button"
                    class="go"
                    data-close
                >
                    Done
                </button>

            </div>

        </div>

    `;

    selectedDeal = null;
}

// ==========================================
// MY BOOKING
// ==========================================

function openBookings() {

    const bookings = loadBookings();

    let content = `<h2>My Booking</h2>`;

    if (bookings.length > 0) {

        content += bookings.map(booking => `

            <div class="sum">

                <span class="code sm">
                    ${esc(booking.code)}
                </span>

                <br><br>

                <b>
                    ${esc(booking.from)}
                    →
                    ${esc(booking.to)}
                </b>

                <br>

                Passenger: ${esc(booking.name)}

                <br>

                Airline: ${esc(booking.airline)}

                <br>

                Date: ${esc(booking.date)}

                <br>

                Time: ${esc(booking.time)}

                <br>

                Passengers: ${booking.pax}

                <br>

                Total:
                <b class="price">${rp(booking.total)}</b>

                <br>

                Status:
                <b>${esc(booking.status || "Confirmed")}</b>

            </div>

        `).join("");

    } else {

        content += `

            <p class="muted">
                No bookings yet.
                Pick a flight in Best Deals to get started.
            </p>

        `;
    }

    content += `

        <div class="acts">

            <button
                type="button"
                class="ghost"
                data-close
            >
                Close
            </button>

        </div>

    `;

    $("#dlg-body").innerHTML = content;

    dlg.showModal();
}

// ==========================================
// DATE VALIDATION
// ==========================================

$("#dep").addEventListener("change", () => {

    const departure = $("#dep").value;

    $("#ret").min = departure;

    if ($("#ret").value < departure) {
        $("#ret").value = departure;
    }

    renderDeals();
});

$("#ret").addEventListener("change", () => {

    if ($("#ret").value < $("#dep").value) {
        $("#ret").value = $("#dep").value;
        toast("Return date cannot be before departure.");
    }
});

// ==========================================
// TRIP TYPE
// ==========================================

$$(".tab").forEach(button => {

    button.addEventListener("click", () => {

        const type = button.dataset.trip;

        if (type === "multi") {
            toast("Multi-City feature coming soon!");
            return;
        }

        trip = type;

        $$(".tab").forEach(tab => {
            tab.classList.toggle("on", tab === button);
        });

        $("#ret-box").hidden = trip === "oneway";
        $("#ret").required = trip === "round";
    });

});

// ==========================================
// SWAP CITIES
// ==========================================

$("#swap").addEventListener("click", () => {

    const from = $("#from").value;
    const to = $("#to").value;

    $("#from").value = to;
    $("#to").value = from;

    renderDeals();

});

// ==========================================
// SEARCH FORM
// ==========================================

$("#form").addEventListener("submit", event => {

    event.preventDefault();

    searchFlights();

});

// ==========================================
// DIALOG FORM SUBMISSION
// ==========================================

$("#dlg-body").addEventListener("submit", event => {

    if (event.target.id !== "bk") return;

    event.preventDefault();

    if (!event.target.reportValidity()) return;

    if (selectedDeal) {
        confirmBook(event.target, selectedDeal);
    }

});

// ==========================================
// CLICK EVENTS
// ==========================================

document.addEventListener("click", event => {

    const target = event.target;

    // Book Now

    const bookButton = target.closest(".book");

    if (bookButton) {

        const index = Number(bookButton.dataset.i);

        openBook(deals[index]);

        return;
    }

    // Close dialog

    if (target.closest("[data-close]")) {

        dlg.close();
        return;
    }

    // Popular Routes

    const route = target.closest(".route");

    if (route) {

        $("#from").value = "CGK";
        $("#to").value = route.dataset.to;

        searchFlights();

        return;
    }

    // Sidebar Navigation

    const nav = target.closest("[data-nav]");

    if (nav) {

        event.preventDefault();

        const page = nav.dataset.nav;

        if (page === "booking") {
            openBookings();
            return;
        }

        if (page === "home") {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
            return;
        }

        if (page === "checkin") {
            toast("Check-in feature coming soon!");
            return;
        }

        if (page === "profile") {
            toast("Profile feature coming soon!");
            return;
        }

        if (page === "help") {
            toast("SkyFly Help Center coming soon!");
            return;
        }

        if (page === "hotels") {
            toast("Hotel booking coming soon!");
            return;
        }

        if (page === "explore") {
            toast("Explore destinations coming soon!");
            return;
        }
    }

});

// ==========================================
// SIDEBAR ACTIVE STATE
// ==========================================

$$(".side nav a").forEach(link => {

    link.addEventListener("click", () => {

        $$(".side nav a").forEach(item => {
            item.classList.remove("on");
        });

        link.classList.add("on");

    });

});

// ==========================================
// INITIALIZE SKYFLY
// ==========================================

setup();

console.log("SkyFly initialized successfully!");
