
const deals = [
    ["Garuda Indonesia", "The Airline of Indonesia", "08:00", "2h 15m", "10:15", "Rp 1.235.000"],
    ["Lion Air", "We make people fly", "09:30", "2h 20m", "11:50", "Rp 1.150.000"],
    ["Batik Air", "Fly with Style", "11:20", "2h 25m", "13:45", "Rp 1.180.000"]
];

// Menampilkan daftar penerbangan
const dealList = document.getElementById("deals");

dealList.innerHTML = deals.map(deal => `
    <div class="deal">

        <div>
            <b>${deal[0]}</b>
            <small>${deal[1]}</small>
        </div>

        <div>
            <b>CGK → DPS</b>
            <small>Jakarta → Bali</small>
        </div>

        <div>
            <b>${deal[2]} - ${deal[4]}</b>
            <small>${deal[3]} | 29 November</small>
        </div>

        <div>
            <div class="price">${deal[5]}</div>
            <button class="book">Book Now</button>
        </div>

    </div>
`).join("");

// Menukar kota asal dan tujuan
const swapButton = document.getElementById("swap");

swapButton.onclick = function () {
    const from = document.getElementById("from");
    const to = document.getElementById("to");

    const temporary = from.textContent;

    from.textContent = to.textContent;
    to.textContent = temporary;
};
