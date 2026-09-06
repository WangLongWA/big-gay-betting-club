const SUPABASE_URL = "https://yjovpmcofcuiccnloddy.supabase.co";
const SUPABASE_KEY = "sb_publishable_-9WKK2S8yHGlLSipM5kCeA_zndskQwb";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ------------------------------------
// PLAYERS
// ------------------------------------

let players = [
    "Adam",
    "Ben",
    "Hayden",
    "Kristov",
    "Lenko",
    "Ray"
];


// ------------------------------------
// CURRENT BETTING WEEK
// ------------------------------------

let today = new Date();

let day = today.getDay();

let daysUntilFriday = (5 - day + 7) % 7;

let bettingFriday = new Date(today);

bettingFriday.setDate(
    today.getDate() + daysUntilFriday
);


// ------------------------------------
// ROUND START
// ------------------------------------

let startFriday = new Date(2026, 8, 4);


// ------------------------------------
// WORK OUT CURRENT PUNTER
// ------------------------------------

let weeksSinceStart = Math.floor(
    (bettingFriday - startFriday) /
    (7 * 24 * 60 * 60 * 1000)
);

let currentPlayer =
    weeksSinceStart % players.length;

let nextPlayer =
    (currentPlayer + 1) % players.length;


// ------------------------------------
// DISPLAY CURRENT WEEK
// ------------------------------------

let dateText =
    bettingFriday.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

document.getElementById("week-number").textContent =
    dateText;

document.getElementById("this-week").textContent =
    players[currentPlayer];

document.getElementById("next-week").textContent =
    players[nextPlayer];


// ------------------------------------
// ROUND SCHEDULE
// ------------------------------------

let schedule =
    document.getElementById("round-schedule");

for (let i = 0; i < players.length; i++) {

    let weekDate = new Date(startFriday);

    weekDate.setDate(
        startFriday.getDate() + (i * 7)
    );

    let scheduleDate =
        weekDate.toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    let row =
        document.createElement("tr");

    row.innerHTML = `
        <td>${i + 1}</td>
        <td>${scheduleDate}</td>
        <td>${players[i]}</td>
    `;

    schedule.appendChild(row);
}


// ------------------------------------
// BETTING RESULTS TABLE
// ------------------------------------

let resultsTable =
    document.getElementById("betting-results");

for (let i = 0; i < players.length; i++) {

    let weekDate =
        new Date(startFriday);

    weekDate.setDate(
        startFriday.getDate() + (i * 7)
    );

    let resultDate =
        weekDate.toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    let row =
        document.createElement("tr");

    row.innerHTML = `
        <td>${resultDate}</td>

        <td>${players[i]}</td>

        <td>$20</td>

        <td>
            <input
                type="text"
                class="result"
                placeholder="Result"
                data-index="${i}"
            >
        </td>

        <td>
            <input
                type="number"
                class="winnings"
                placeholder="0"
                data-index="${i}"
            >
        </td>
    `;

    resultsTable.appendChild(row);
}


// ------------------------------------
// LOAD RESULTS FROM SUPABASE
// ------------------------------------

async function loadBettingResults() {

    const {
        data,
        error
    } = await supabaseClient
        .from("betting_results")
        .select("*")
        .eq("round", 1)
        .order("week");

    if (error) {

        console.error(
            "Error loading betting results:",
            error
        );

        return;
    }

    console.log(
        "Betting results loaded:",
        data
    );


    // Put database values into the table

    data.forEach(function(result) {

        let index =
            result.week - 1;

        let resultInput =
            document.querySelectorAll(".result")[index];

        let winningsInput =
            document.querySelectorAll(".winnings")[index];


        if (resultInput) {

            resultInput.value =
                result.result || "";
        }


        if (winningsInput) {

            winningsInput.value =
                result.winnings ?? "";
        }

    });


    updateTotalKitty();
}


// ------------------------------------
// SAVE A BETTING RESULT
// ------------------------------------

async function saveBettingResult(index) {

    let resultInput =
        document.querySelectorAll(".result")[index];

    let winningsInput =
        document.querySelectorAll(".winnings")[index];


    let weekDate =
        new Date(startFriday);

    weekDate.setDate(
        startFriday.getDate() + (index * 7)
    );


    let friday =
        weekDate.toISOString().split("T")[0];


    let result =
        resultInput.value;


    let winnings =
        winningsInput.value === ""
            ? 0
            : Number(winningsInput.value);


    // Check whether this week already exists

    const {
        data: existing,
        error: findError
    } = await supabaseClient
        .from("betting_results")
        .select("id")
        .eq("round", 1)
        .eq("week", index + 1)
        .maybeSingle();


    if (findError) {

        console.error(
            "Error checking result:",
            findError
        );

        return;
    }


    // --------------------------------
    // UPDATE EXISTING RESULT
    // --------------------------------

    if (existing) {

        const {
            error
        } = await supabaseClient
            .from("betting_results")
            .update({
                friday: friday,
                punter: players[index],
                result: result,
                winnings: winnings
            })
            .eq("id", existing.id);


        if (error) {

            console.error(
                "Error updating result:",
                error
            );

        } else {

            console.log(
                "Betting result updated."
            );

        }

    }


    // --------------------------------
    // CREATE NEW RESULT
    // --------------------------------

    else {

        const {
            error
        } = await supabaseClient
            .from("betting_results")
            .insert({
                round: 1,
                week: index + 1,
                friday: friday,
                punter: players[index],
                result: result,
                winnings: winnings
            });


        if (error) {

            console.error(
                "Error saving result:",
                error
            );

        } else {

            console.log(
                "Betting result saved."
            );

        }

    }


    updateTotalKitty();
}


// ------------------------------------
// RESULT INPUT
// ------------------------------------

document
    .querySelectorAll(".result")
    .forEach(function(input, index) {

        input.addEventListener(
            "change",
            function() {

                saveBettingResult(index);

            }
        );

    });


// ------------------------------------
// WINNINGS INPUT
// ------------------------------------

document
    .querySelectorAll(".winnings")
    .forEach(function(input, index) {

        input.addEventListener(
            "change",
            function() {

                saveBettingResult(index);

            }
        );

    });


// ------------------------------------
// TOTAL KITTY
// ------------------------------------

function updateTotalKitty() {

    let totalKitty = 180;

    let totalWinnings = 0;

    let weeksCompleted = 0;


    let winningsInputs =
        document.querySelectorAll(".winnings");


    winningsInputs.forEach(function(input) {

        if (input.value !== "") {

            let winnings =
                Number(input.value);

            totalWinnings += winnings;

            totalKitty =
                totalKitty - 20 + winnings;

            weeksCompleted++;

        }

    });


    let kittyDisplay =
        document.getElementById("total-kitty");

    if (kittyDisplay) {

        kittyDisplay.textContent =
            "$" + totalKitty.toFixed(0);

    }


    let winningsDisplay =
        document.getElementById("total-winnings");

    if (winningsDisplay) {

        winningsDisplay.textContent =
            totalWinnings.toFixed(0);

    }


    let weeksDisplay =
        document.getElementById("weeks-completed");

    if (weeksDisplay) {

        weeksDisplay.textContent =
            weeksCompleted;

    }

}


// ------------------------------------
// LOAD DATABASE WHEN PAGE OPENS
// ------------------------------------

loadBettingResults();