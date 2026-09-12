const SUPABASE_URL = "https://yjovpmcofcuiccnloddy.supabase.co";
const SUPABASE_KEY = "sb_publishable_-9WKK2S8yHGlLSipM5kCeA_zndskQwb";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ------------------------------------
// PLAYERS
// ------------------------------------

const players = [
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
const CONTRIBUTION = 30;
const UNBET_AMOUNT = CONTRIBUTION - STAKE;
const STARTING_KITTY = 180;

const startFriday = new Date(2026, 8, 4);


// ------------------------------------
// CURRENT DATE / WEEK
// ------------------------------------

const today = new Date();

const day = today.getDay();

const daysUntilFriday =
    (5 - day + 7) % 7;

const bettingFriday = new Date(today);

bettingFriday.setHours(0, 0, 0, 0);

bettingFriday.setDate(
    today.getDate() + daysUntilFriday
);


// ------------------------------------
// ROUND / WEEK CALCULATION
// ------------------------------------

const totalWeeksSinceStart = Math.max(
    0,
    Math.floor(
        (bettingFriday - startFriday) /
        (7 * 24 * 60 * 60 * 1000)
    )
);

const currentRound =
    Math.floor(
        totalWeeksSinceStart / WEEKS_PER_ROUND
    ) + 1;

const currentWeek =
    (totalWeeksSinceStart % WEEKS_PER_ROUND) + 1;


// ------------------------------------
// CURRENT / NEXT PUNTER
// ------------------------------------

const currentPlayerIndex =
    totalWeeksSinceStart % players.length;

const nextPlayerIndex =
    (currentPlayerIndex + 1) % players.length;

const currentPlayer =
    players[currentPlayerIndex];

const nextPlayer =
    players[nextPlayerIndex];


// ------------------------------------
// DATE FORMATTING
// ------------------------------------

function formatDate(date) {

    return date.toLocaleDateString(
        "en-AU",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


function formatDatabaseDate(date) {

    const year = date.getFullYear();

    const month =
        String(date.getMonth() + 1).padStart(2, "0");

    const day =
        String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ------------------------------------
// DISPLAY ROUND INFORMATION
// ------------------------------------

const weekNumberElement =
    document.getElementById("week-number");

if (weekNumberElement) {

    weekNumberElement.textContent =
        formatDate(bettingFriday);
}


const thisWeekElement =
    document.getElementById("this-week");

if (thisWeekElement) {

    thisWeekElement.textContent =
        currentPlayer;
}


const nextWeekElement =
    document.getElementById("next-week");

if (nextWeekElement) {

    nextWeekElement.textContent =
        nextPlayer;
}


// ------------------------------------
// DISPLAY ROUND NUMBER
// ------------------------------------

const roundElements =
    document.querySelectorAll(".rotation-card p");

if (roundElements[1]) {

    roundElements[1].innerHTML =
        `<strong>Round:</strong> ${currentRound} of ${WEEKS_PER_ROUND} weeks`;
}


// ------------------------------------
// ROUND SCHEDULE
// ------------------------------------

function buildSchedule() {

    const schedule =
        document.getElementById("round-schedule");

    if (!schedule) {
        return;
    }

    schedule.innerHTML = "";

    const roundStartWeek =
        totalWeeksSinceStart -
        (currentWeek - 1);

    for (let i = 0; i < WEEKS_PER_ROUND; i++) {

        const actualWeek =
            roundStartWeek + i;

        const weekDate =
            new Date(startFriday);

        weekDate.setDate(
            startFriday.getDate() +
            actualWeek * 7
        );

        const punter =
            players[
                actualWeek % players.length
            ];

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${formatDate(weekDate)}</td>
            <td>${punter}</td>
        `;

        schedule.appendChild(row);
    }
}


// ------------------------------------
// BETTING INPUT TABLE
// ------------------------------------

function buildBettingTable() {

    const tableBody =
        document.getElementById("betting-results");

    if (!tableBody) {
        return;
    }

    // Fix the table headings automatically
    const table =
        tableBody.closest("table");

    if (table) {

        const thead =
            table.querySelector("thead");

        if (thead) {

            thead.innerHTML = `
                <tr>
                    <th>Date</th>
                    <th>Punter</th>
                    <th>Stake</th>
                    <th>Odds</th>
                    <th>Result</th>
                    <th>Winnings</th>
                </tr>
            `;
        }
    }

    tableBody.innerHTML = "";

    const roundStartWeek =
        totalWeeksSinceStart -
        (currentWeek - 1);

    for (let i = 0; i < WEEKS_PER_ROUND; i++) {

        const actualWeek =
            roundStartWeek + i;

        const weekDate =
            new Date(startFriday);

        weekDate.setDate(
            startFriday.getDate() +
            actualWeek * 7
        );

        const punter =
            players[
                actualWeek % players.length
            ];

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${formatDate(weekDate)}</td>

            <td>${punter}</td>

            <td>$${STAKE}</td>

            <td>
                <input
                    type="number"
                    class="odds"
                    min="1"
                    step="0.01"
                    placeholder="2.50"
                    data-week="${i + 1}"
                    style="width:80px;"
                >
            </td>

            <td>
                <select
                    class="result"
                    data-week="${i + 1}"
                >
                    <option value="">--</option>
                    <option value="W">W</option>
                    <option value="L">L</option>
                </select>
            </td>

            <td>
                <span
                    class="winnings"
                    data-week="${i + 1}"
                >
                    $0
                </span>
            </td>
        `;

        tableBody.appendChild(row);
    }

    // Odds changes
    document
        .querySelectorAll(".odds")
        .forEach(function(input) {

            input.addEventListener(
                "change",
                function() {

                    updateDisplayedWinnings(
                        Number(this.dataset.week) - 1
                    );

                    saveBet(
                        Number(this.dataset.week) - 1
                    );
                }
            );

        });


    // Result changes
    document
        .querySelectorAll(".result")
        .forEach(function(input) {

            input.addEventListener(
                "change",
                function() {

                    updateDisplayedWinnings(
                        Number(this.dataset.week) - 1
                    );

                    saveBet(
                        Number(this.dataset.week) - 1
                    );
                }
            );

        });
}


// ------------------------------------
// CALCULATE WINNINGS
// ------------------------------------

function calculateWinnings(odds, result) {

    if (
        result !== "W" ||
        !odds ||
        Number(odds) <= 0
    ) {
        return 0;
    }

    return STAKE * Number(odds);
}


// ------------------------------------
// UPDATE DISPLAYED WINNINGS
// ------------------------------------

function updateDisplayedWinnings(index) {

    const oddsInputs =
        document.querySelectorAll(".odds");

    const resultInputs =
        document.querySelectorAll(".result");

    const winningsDisplays =
        document.querySelectorAll(".winnings");

    const odds =
        oddsInputs[index]
            ? Number(oddsInputs[index].value)
            : 0;

    const result =
        resultInputs[index]
            ? resultInputs[index].value
            : "";

    const winnings =
        calculateWinnings(
            odds,
            result
        );

    if (winningsDisplays[index]) {

        winningsDisplays[index].textContent =
            "$" + winnings.toFixed(2);
    }
}


// ------------------------------------
// LOAD CURRENT ROUND
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


    const oddsInputs =
        document.querySelectorAll(".odds");

    const resultInputs =
        document.querySelectorAll(".result");


    data.forEach(function(bet) {

        const index =
            Number(bet.week) - 1;

        if (resultInputs[index]) {

            let result =
                (bet.result || "")
                    .toString()
                    .trim()
                    .toUpperCase();

            // Support old "win"/"loss" data
            if (result === "WIN") {
                result = "W";
            }

            if (
                result === "LOSS" ||
                result === "LOSE"
            ) {
                result = "L";
            }

            resultInputs[index].value =
                result;
        }


        if (
            oddsInputs[index] &&
            bet.odds !== null &&
            bet.odds !== undefined
        ) {

            oddsInputs[index].value =
                bet.odds;
        }


        updateDisplayedWinnings(index);

    });


    await refreshAllDisplays();
}


// ------------------------------------
// SAVE BET
// ------------------------------------

async function saveBet(index) {

    const oddsInputs =
        document.querySelectorAll(".odds");

    const resultInputs =
        document.querySelectorAll(".result");


    const odds =
        oddsInputs[index]
            ? Number(oddsInputs[index].value)
            : 0;

    const result =
        resultInputs[index]
            ? resultInputs[index].value
            : "";


    const winnings =
        calculateWinnings(
            odds,
            result
        );


    const week =
        index + 1;


    const actualWeekNumber =
        totalWeeksSinceStart -
        (currentWeek - 1) +
        index;


    const weekDate =
        new Date(startFriday);

    weekDate.setDate(
        startFriday.getDate() +
        actualWeekNumber * 7
    );


    const friday =
        formatDatabaseDate(weekDate);


    const punter =
        players[
            actualWeekNumber % players.length
        ];


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


    const betData = {

        round: currentRound,

        week: week,

        friday: friday,

        punter: punter,

        result: result,

        winnings: winnings,

        odds: odds || null
    };


    // --------------------------------
    // UPDATE
    // --------------------------------

    if (existing) {

        const {
            error
        } = await supabaseClient
            .from("betting_results")
            .update(betData)
            .eq("id", existing.id);


        if (error) {

            console.error(
                "Error updating bet:",
                error
            );

            return;
        }

    }


    // --------------------------------
    // INSERT
    // --------------------------------

    else {

        const {
            error
        } = await supabaseClient
            .from("betting_results")
            .insert(betData);


        if (error) {

            console.error(
                "Error saving bet:",
                error
            );

            return;
        }
    }


    await refreshAllDisplays();
}


// ------------------------------------
// LOAD ALL RESULTS
// ------------------------------------

async function loadAllResults() {

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
            "Error loading results:",
            error
        );

        return [];
    }


    return data || [];
}


// ------------------------------------
// CALCULATE KITTY
// ------------------------------------

function calculateKitty(data) {

    let kitty =
        STARTING_KITTY;


    let totalWinnings =
        0;


    let completedBets =
        0;


    // Only count one result
    // for each round/week

    const completed =
        data.filter(function(bet) {

            return (
                bet.result &&
                bet.result.toString().trim() !== ""
            );

        });


    completed.forEach(function(bet) {

        const winnings =
            Number(bet.winnings) || 0;


        // $10 of each $30 contribution
        // remains in the kitty

        kitty += UNBET_AMOUNT;


        // If the bet wins, the payout
        // comes back into the kitty

        kitty += winnings;


        totalWinnings +=
            winnings;


        completedBets++;

    });


    return {

        kitty: kitty,

        totalWinnings: totalWinnings,

        completedBets: completedBets

    };
}


// ------------------------------------
// UPDATE KITTY DISPLAY
// ------------------------------------

function updateKittyDisplay(data) {

    const stats =
        calculateKitty(data);


    const kittyElement =
        document.getElementById(
            "total-kitty"
        );


    if (kittyElement) {

        kittyElement.textContent =
            "$" +
            stats.kitty.toFixed(0);
    }


    const winningsElement =
        document.getElementById(
            "total-winnings"
        );


    if (winningsElement) {

        winningsElement.textContent =
            stats.totalWinnings.toFixed(0);
    }


    const weeksElement =
        document.getElementById(
            "weeks-completed"
        );


    if (weeksElement) {

        weeksElement.textContent =
            stats.completedBets;
    }
}


// ------------------------------------
// PLAYER STANDINGS
// ------------------------------------

async function updateStandings(data) {

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


    data.forEach(function(bet) {

        if (
            !standings[bet.punter]
        ) {
            return;
        }


        const player =
            standings[bet.punter];


        const winnings =
            Number(bet.winnings) || 0;


        player.totalWinnings +=
            winnings;


        let result =
            (bet.result || "")
                .toString()
                .trim()
                .toUpperCase();


        if (result === "WIN") {
            result = "W";
        }


        if (
            result === "LOSS" ||
            result === "LOSE"
        ) {
            result = "L";
        }


        if (
            result === "W" ||
            result === "L"
        ) {

            player.results.push({

                round:
                    Number(bet.round),

                week:
                    Number(bet.week),

                result:
                    result

            });

        }

    });


    // --------------------------------
    // CALCULATE STREAKS
    // --------------------------------

    players.forEach(function(player) {

        const stats =
            standings[player];


        stats.results.sort(function(a, b) {

            if (
                a.round !== b.round
            ) {

                return (
                    a.round -
                    b.round
                );
            }


            return (
                a.week -
                b.week
            );

        });


        let currentStreak = 0;

        let bestStreak = 0;


        stats.results.forEach(function(bet) {

            if (
                bet.result === "W"
            ) {

                stats.wins++;

                currentStreak++;


                if (
                    currentStreak >
                    bestStreak
                ) {

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

    const table =
        document.getElementById(
            "standings-table"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    const sortedPlayers =
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

        const stats =
            standings[player];


        const currentStreak =
            stats.currentStreak > 0
                ? "HOT " +
                  stats.currentStreak
                : "-";


        const bestStreak =
            stats.bestStreak > 0
                ? stats.bestStreak
                : "-";


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>${player}</strong>
            </td>

            <td>
                ${stats.wins}
            </td>

            <td>
                $${stats.totalWinnings.toFixed(2)}
            </td>

            <td>
                ${currentStreak}
            </td>

            <td>
                ${bestStreak}
            </td>

        `;


        table.appendChild(row);

    });
}


// ------------------------------------
// ROUND HISTORY
// ------------------------------------

async function loadRoundHistory(data) {

    const historyContainer =
        document.getElementById(
            "round-history"
        );


    if (!historyContainer) {
        return;
    }


    historyContainer.innerHTML = "";


    const history = {};


    data.forEach(function(bet) {

        const round =
            Number(bet.round);


        if (!history[round]) {

            history[round] = [];

        }


        history[round].push(bet);

    });


    const rounds =
        Object.keys(history).sort(
            (a, b) => Number(b) - Number(a)
        );


    rounds.forEach(function(round) {

        const bets =
            history[round];


        bets.sort(function(a, b) {

            return (
                Number(a.week) -
                Number(b.week)
            );

        });


        const completed =
            bets.filter(function(bet) {

                return (
                    bet.result &&
                    bet.result
                        .toString()
                        .trim() !== ""
                );

            }).length;


        const wins =
            bets.filter(function(bet) {

                const result =
                    (bet.result || "")
                        .toString()
                        .trim()
                        .toUpperCase();

                return (
                    result === "W" ||
                    result === "WIN"
                );

            }).length;


        const totalWinnings =
            bets.reduce(function(total, bet) {

                return (
                    total +
                    (Number(bet.winnings) || 0)
                );

            }, 0);


        // Calculate kitty after each
        // completed historical bet

        let kitty =
            STARTING_KITTY;


        const rows =
            bets.map(function(bet) {

                const winnings =
                    Number(bet.winnings) || 0;


                const result =
                    (bet.result || "")
                        .toString()
                        .trim()
                        .toUpperCase();


                let resultDisplay =
                    "-";


                if (result === "W") {

                    resultDisplay =
                        `<strong>W</strong>`;

                }


                if (result === "L") {

                    resultDisplay =
                        `<strong>L</strong>`;

                }


                if (
                    result === "W" ||
                    result === "L"
                ) {

                    kitty +=
                        UNBET_AMOUNT;

                    kitty +=
                        winnings;

                }


                const date =
                    bet.friday
                        ? new Date(
                            bet.friday +
                            "T00:00:00"
                        )
                        : null;


                const dateText =
                    date
                        ? formatDate(date)
                        : "-";


                const odds =
                    bet.odds !== null &&
                    bet.odds !== undefined
                        ? Number(bet.odds)
                            .toFixed(2)
                        : "-";


                return `

                    <tr>

                        <td>
                            ${bet.week}
                        </td>

                        <td>
                            ${dateText}
                        </td>

                        <td>
                            ${bet.punter}
                        </td>

                        <td>
                            $${STAKE}
                        </td>

                        <td>
                            ${odds}
                        </td>

                        <td>
                            ${resultDisplay}
                        </td>

                        <td>
                            $${winnings.toFixed(2)}
                        </td>

                        <td>
                            $${kitty.toFixed(0)}
                        </td>

                    </tr>

                `;

            });


        const section =
            document.createElement("div");


        section.className =
            "history-round";


        section.innerHTML = `

            <h3>
                Round ${round}
                ${
                    completed === WEEKS_PER_ROUND
                        ? "Completed"
                        : "In Progress"
                }
            </h3>

            <p>

                <strong>Weeks:</strong>
                ${completed} / ${WEEKS_PER_ROUND}

                &nbsp;&nbsp;

                <strong>Wins:</strong>
                ${wins}

                &nbsp;&nbsp;

                <strong>Total Winnings:</strong>
                $${totalWinnings.toFixed(2)}

            </p>

            <table>

                <thead>

                    <tr>

                        <th>Week</th>

                        <th>Date</th>

                        <th>Punter</th>

                        <th>Stake</th>

                        <th>Odds</th>

                        <th>Result</th>

                        <th>Winnings</th>

                        <th>Kitty After</th>

                    </tr>

                </thead>

                <tbody>

                    ${rows.join("")}

                </tbody>

            </table>

        `;


        historyContainer.appendChild(
            section
        );

    });

}


// ------------------------------------
// UPDATE THIS WEEK'S BET CARD
// ------------------------------------

function updateCurrentBetCard(data) {

    const currentBet =
        data.find(function(bet) {

            return (
                Number(bet.round) ===
                currentRound &&
                Number(bet.week) ===
                currentWeek
            );

        });


    const playerElement =
        document.getElementById(
            "current-bet-player"
        );


    const resultElement =
        document.getElementById(
            "current-bet-result"
        );


    const winningsElement =
        document.getElementById(
            "current-bet-winnings"
        );


    if (playerElement) {

        playerElement.textContent =
            currentBet
                ? currentBet.punter
                : currentPlayer;

    }


    if (resultElement) {

        let result =
            currentBet
                ? currentBet.result
                : "";


        result =
            (result || "")
                .toString()
                .trim()
                .toUpperCase();


        if (result === "WIN") {
            result = "W";
        }


        if (result === "LOSS") {
            result = "L";
        }


        resultElement.textContent =
            result || "-";

    }


    if (winningsElement) {

        winningsElement.textContent =
            currentBet
                ? Number(
                    currentBet.winnings
                ).toFixed(2)
                : "0.00";

    }

}


// ------------------------------------
// REFRESH EVERYTHING
// ------------------------------------

async function refreshAllDisplays() {

    const data =
        await loadAllResults();


    updateKittyDisplay(data);

    await updateStandings(data);

    await loadRoundHistory(data);

    updateCurrentBetCard(data);

}


// ------------------------------------
// START APP
// ------------------------------------

buildSchedule();

buildBettingTable();

loadCurrentRound();