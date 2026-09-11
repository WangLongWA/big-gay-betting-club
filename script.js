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
// ROUND SETTINGS
// ------------------------------------

const WEEKS_PER_ROUND = 6;
const STAKE = 20;

let startFriday = new Date(2026, 8, 4);


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
// WORK OUT ROUND AND WEEK
// ------------------------------------

let totalWeeksSinceStart = Math.floor(
    (bettingFriday - startFriday) /
    (7 * 24 * 60 * 60 * 1000)
);

let currentRound =
    Math.floor(totalWeeksSinceStart / WEEKS_PER_ROUND) + 1;

let currentWeek =
    (totalWeeksSinceStart % WEEKS_PER_ROUND) + 1;


// ------------------------------------
// WORK OUT CURRENT PUNTER
// ------------------------------------

let currentPlayer =
    (totalWeeksSinceStart % players.length);

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
// DISPLAY ROUND INFORMATION
// ------------------------------------

let roundElements =
    document.querySelectorAll(".rotation-card p");


// Round: 1 of 6 weeks
if (roundElements[1]) {
    roundElements[1].innerHTML =
        `<strong>Round:</strong> ${currentRound} of 6 weeks`;
}


// Weeks completed
if (document.getElementById("weeks-completed")) {

    document.getElementById("weeks-completed").textContent =
        currentWeek - 1;
}


// ------------------------------------
// ROUND SCHEDULE
// ------------------------------------

let schedule =
    document.getElementById("round-schedule");

schedule.innerHTML = "";


for (let i = 0; i < WEEKS_PER_ROUND; i++) {

    let weekDate =
        new Date(startFriday);

    weekDate.setDate(
        startFriday.getDate() +
        (totalWeeksSinceStart - (currentWeek - 1) + i) * 7
    );


    let scheduleDate =
        weekDate.toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });


    let punter =
        players[
            (
                totalWeeksSinceStart -
                (currentWeek - 1) +
                i
            ) % players.length
        ];


    let row =
        document.createElement("tr");


    row.innerHTML = `
        <td>${i + 1}</td>
        <td>${scheduleDate}</td>
        <td>${punter}</td>
    `;


    schedule.appendChild(row);
}


// ------------------------------------
// BETTING RESULTS TABLE
// ------------------------------------

let resultsTable =
    document.getElementById("betting-results");

resultsTable.innerHTML = "";


for (let i = 0; i < WEEKS_PER_ROUND; i++) {

    let weekNumber = i + 1;


    let weekDate =
        new Date(startFriday);

    weekDate.setDate(
        startFriday.getDate() +
        (
            totalWeeksSinceStart -
            (currentWeek - 1) +
            i
        ) * 7
    );


    let resultDate =
        weekDate.toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });


    let punter =
        players[
            (
                totalWeeksSinceStart -
                (currentWeek - 1) +
                i
            ) % players.length
        ];


    let row =
        document.createElement("tr");


    row.innerHTML = `
        <td>${resultDate}</td>

        <td>${punter}</td>

        <td>$${STAKE}</td>

        <td>
            <input
                type="text"
                class="result"
                placeholder="Result"
                data-week="${weekNumber}"
            >
        </td>

        <td>
            <input
                type="number"
                class="winnings"
                placeholder="0"
                data-week="${weekNumber}"
            >
        </td>
    `;


    resultsTable.appendChild(row);
}


// ------------------------------------
// LOAD CURRENT ROUND FROM SUPABASE
// ------------------------------------

async function loadCurrentRound() {

    const {
        data,
        error
    } = await supabaseClient
        .from("betting_results")
        .select("*")
        .eq("round", currentRound)
        .order("week", {
            ascending: true
        });


    if (error) {

        console.error(
            "Error loading current round:",
            error
        );

        return;
    }


    console.log(
        "Current round loaded:",
        data
    );


    data.forEach(function(bet) {

        let index =
            Number(bet.week) - 1;


        let resultInput =
            document.querySelectorAll(".result")[index];


        let winningsInput =
            document.querySelectorAll(".winnings")[index];


        if (resultInput) {

            resultInput.value =
                bet.result || "";

        }


        if (winningsInput) {

            winningsInput.value =
                bet.winnings ?? "";

        }

    });


   function updateTotalKitty() {

    const STARTING_KITTY = 180;
    const UNBET_AMOUNT = 10;

    let totalKitty = STARTING_KITTY;
    let totalWinnings = 0;
    let completedBets = 0;

    document.querySelectorAll(".winnings").forEach(function(input) {

        if (input.value !== "") {

            let winnings = Number(input.value) || 0;

            // $10 of each $30 contribution remains in the kitty
            totalKitty += UNBET_AMOUNT;

            // Winnings are the total payout, including the $20 stake
            totalKitty += winnings;

            totalWinnings += winnings;

            completedBets++;
        }
    });

    document.getElementById("total-kitty").textContent =
        "$" + totalKitty.toFixed(0);

    document.getElementById("total-winnings").textContent =
        totalWinnings.toFixed(0);

    document.getElementById("weeks-completed").textContent =
        completedBets;
}

    updateStandings();
}


// ------------------------------------
// SAVE BET
// ------------------------------------

async function saveBet(index) {

    let resultInput =
        document.querySelectorAll(".result")[index];


    let winningsInput =
        document.querySelectorAll(".winnings")[index];


    let result =
        resultInput.value.trim();


    let winnings =
        winningsInput.value === ""
            ? 0
            : Number(winningsInput.value);


    let week =
        index + 1;


    let actualWeekNumber =
        totalWeeksSinceStart -
        (currentWeek - 1) +
        index;


    let weekDate =
        new Date(startFriday);


    weekDate.setDate(
        startFriday.getDate() +
        actualWeekNumber * 7
    );


    let friday =
        weekDate.toISOString().split("T")[0];


    let punter =
        players[
            actualWeekNumber % players.length
        ];


    // Check whether this round/week already exists

    const {
        data: existing,
        error: findError
    } = await supabaseClient
        .from("betting_results")
        .select("id")
        .eq("round", currentRound)
        .eq("week", week)
        .maybeSingle();


    if (findError) {

        console.error(
            "Error checking bet:",
            findError
        );

        return;
    }


    // --------------------------------
    // UPDATE EXISTING BET
    // --------------------------------

    if (existing) {

        const {
            error
        } = await supabaseClient
            .from("betting_results")
            .update({
                friday: friday,
                punter: punter,
                result: result,
                winnings: winnings
            })
            .eq("id", existing.id);


        if (error) {

            console.error(
                "Error updating bet:",
                error
            );

        } else {

            console.log(
                "Bet updated:",
                punter,
                result,
                winnings
            );

        }

    }


    // --------------------------------
    // CREATE NEW BET
    // --------------------------------

    else {

        const {
            error
        } = await supabaseClient
            .from("betting_results")
            .insert({
                round: currentRound,
                week: week,
                friday: friday,
                punter: punter,
                result: result,
                winnings: winnings
            });


        if (error) {

            console.error(
                "Error saving bet:",
                error
            );

        } else {

            console.log(
                "Bet saved:",
                punter,
                result,
                winnings
            );

        }

    }


    async function updateTotalKitty() {

    const STARTING_KITTY = 180;
    const UNBET_AMOUNT = 10;

    const { data, error } = await supabaseClient
        .from("betting_results")
        .select("winnings");

    if (error) {
        console.error("Error loading kitty:", error);
        return;
    }

    let totalKitty = STARTING_KITTY;
    let totalWinnings = 0;
    let completedBets = 0;

    data.forEach(function(bet) {

        // Every completed bet leaves $10 in the kitty
        totalKitty += UNBET_AMOUNT;

        // Winnings are the total payout, including the $20 stake
        let winnings = Number(bet.winnings) || 0;

        totalKitty += winnings;
        totalWinnings += winnings;

        completedBets++;
    });

    document.getElementById("total-kitty").textContent =
        "$" + totalKitty.toFixed(0);

    document.getElementById("total-winnings").textContent =
        totalWinnings.toFixed(0);

    document.getElementById("weeks-completed").textContent =
        completedBets;
}

    updateStandings();
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

                saveBet(index);

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

                saveBet(index);

            }
        );

    });


// ------------------------------------
// TOTAL KITTY
// ------------------------------------

function updateTotalKitty() {

    let totalKitty = 180;

    let totalWinnings = 0;

    let completedBets = 0;


    document
        .querySelectorAll(".winnings")
        .forEach(function(input) {

            if (input.value !== "") {

                let winnings =
                    Number(input.value);


                totalWinnings += winnings;


                totalKitty =
                    totalKitty -
                    STAKE +
                    winnings;


                completedBets++;

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
            completedBets;

    }

}


// ------------------------------------
// PLAYER STANDINGS
// ------------------------------------

async function updateStandings() {

    const {
        data,
        error
    } = await supabaseClient
        .from("betting_results")
        .select("*")
        .order("round", {
            ascending: true
        })
        .order("week", {
            ascending: true
        });


    if (error) {

        console.error(
            "Error loading standings:",
            error
        );

        return;
    }


    let standings = {};


    players.forEach(function(player) {

        standings[player] = {

            wins: 0,

            totalWinnings: 0,

            currentStreak: 0,

            bestStreak: 0,

            results: []

        };

    });


    // --------------------------------
    // COLLECT RESULTS
    // --------------------------------

    data.forEach(function(bet) {

        if (!standings[bet.punter]) {
            return;
        }


        let player =
            standings[bet.punter];


        let winnings =
            Number(bet.winnings) || 0;


        player.totalWinnings +=
            winnings;


        player.results.push({
            round: Number(bet.round),
            week: Number(bet.week),
            result: (
                bet.result || ""
            ).trim().toLowerCase()
        });

    });


    // --------------------------------
    // CALCULATE STREAKS
    // --------------------------------

    players.forEach(function(player) {

        let stats =
            standings[player];


        stats.results.sort(function(a, b) {

            if (a.round !== b.round) {
                return a.round - b.round;
            }

            return a.week - b.week;

        });


        let currentStreak = 0;

        let bestStreak = 0;


        stats.results.forEach(function(bet) {

            if (bet.result === "win") {

                stats.wins++;

                currentStreak++;


                if (currentStreak > bestStreak) {

                    bestStreak =
                        currentStreak;

                }

            } else {

                currentStreak = 0;

            }

        });


        stats.currentStreak =
            currentStreak;

        stats.bestStreak =
            bestStreak;

    });


    // --------------------------------
    // DISPLAY STANDINGS
    // --------------------------------

    let table =
        document.getElementById(
            "standings-table"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    // Sort by wins first,
    // then winnings

    let sortedPlayers =
        [...players].sort(function(a, b) {

            if (
                standings[b].wins !==
                standings[a].wins
            ) {

                return (
                    standings[b].wins -
                    standings[a].wins
                );

            }


            return (
                standings[b].totalWinnings -
                standings[a].totalWinnings
            );

        });


    sortedPlayers.forEach(function(player) {

        let stats =
            standings[player];


        let currentStreak =
    stats.currentStreak > 0
        ? "HOT " + stats.currentStreak
        : "-";


        let bestStreak =
            stats.bestStreak > 0
                ? stats.bestStreak
                : "-";


        let row =
            document.createElement("tr");


        row.innerHTML = `
            <td><strong>${player}</strong></td>

            <td>${stats.wins}</td>

            <td>$${stats.totalWinnings}</td>

            <td>${currentStreak}</td>

            <td>${bestStreak}</td>
        `;


        table.appendChild(row);

    });

}


// ------------------------------------
// START APP
// ------------------------------------

loadCurrentRound();
// ------------------------------------
// ROUND HISTORY
// ------------------------------------

async function loadRoundHistory() {

    const { data, error } = await supabaseClient
        .from("betting_results")
        .select("*")
        .order("round", { ascending: false })
        .order("week", { ascending: true });

    if (error) {
        console.error("Error loading round history:", error);
        return;
    }

    let history = {};

    data.forEach(function(bet) {

        let round = Number(bet.round);

        if (!history[round]) {
            history[round] = [];
        }

        history[round].push(bet);
    });

    let historyContainer =
        document.getElementById("round-history");

    historyContainer.innerHTML = "";

    Object.keys(history).forEach(function(round) {

        let bets = history[round];

        let completed =
            bets.length === WEEKS_PER_ROUND;

        let totalWinnings = bets.reduce(function(total, bet) {
            return total + (Number(bet.winnings) || 0);
        }, 0);

        let wins = bets.filter(function(bet) {
            return (
                bet.result &&
                bet.result.toLowerCase() === "win"
            );
        }).length;

        let section = document.createElement("div");

        section.className = "history-round";

        section.innerHTML = `
    <h3>
        Round ${round} ${completed ? "Completed" : "In Progress"}
    </h3>

            <p>
                <strong>Wins:</strong> ${wins}
                &nbsp;&nbsp;
                <strong>Total Winnings:</strong> $${totalWinnings}
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Week</th>
                        <th>Punter</th>
                        <th>Result</th>
                        <th>Winnings</th>
                    </tr>
                </thead>

                <tbody>
                    ${bets.map(function(bet) {

                        return `
                            <tr>
                                <td>${bet.week}</td>
                                <td>${bet.punter}</td>
                                <td>${bet.result || "-"}</td>
                                <td>$${Number(bet.winnings) || 0}</td>
                            </tr>
                        `;

                    }).join("")}
                </tbody>
            </table>
        `;

        historyContainer.appendChild(section);

    });
}


// ------------------------------------
// LOAD ROUND HISTORY
// ------------------------------------

loadRoundHistory();