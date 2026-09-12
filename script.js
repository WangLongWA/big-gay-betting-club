const SUPABASE_URL =
    "https://yjovpmcofcuiccnloddy.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_-9WKK2S8yHGlLSipM5kCeA_zndskQwb";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ====================================
// PLAYERS
// ====================================

const players = [
    "Adam",
    "Ben",
    "Hayden",
    "Kristov",
    "Lenko",
    "Ray"
];


// ====================================
// SETTINGS
// ====================================

const WEEKS_PER_ROUND = 6;
const MAX_ROUNDS = 30;

const STAKE = 20;
const CONTRIBUTION = 30;
const UNBET_AMOUNT = CONTRIBUTION - STAKE;

const STARTING_KITTY = 180;

const startFriday = new Date(2026, 8, 4);
startFriday.setHours(0, 0, 0, 0);


// ====================================
// CURRENT DATE / ROUND
// ====================================

function getCurrentFriday() {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const day = today.getDay();

    const daysSinceFriday =
        (day + 2) % 7;

    const friday = new Date(today);

    friday.setDate(
        today.getDate() - daysSinceFriday
    );

    return friday;
}


const bettingFriday =
    getCurrentFriday();


const millisecondsPerWeek =
    7 * 24 * 60 * 60 * 1000;


const totalWeeksSinceStart =
    Math.max(
        0,
        Math.floor(
            (
                bettingFriday -
                startFriday
            ) /
            millisecondsPerWeek
        )
    );


const currentRound =
    Math.floor(
        totalWeeksSinceStart /
        WEEKS_PER_ROUND
    ) + 1;


const currentWeek =
    (
        totalWeeksSinceStart %
        WEEKS_PER_ROUND
    ) + 1;


// ====================================
// SELECTED BOOKIE ROUND
// ====================================

let selectedBookieRound =
    currentRound;


// ====================================
// DATE HELPERS
// ====================================

function getRoundStartWeek(round) {

    return (
        (round - 1) *
        WEEKS_PER_ROUND
    );
}


function getWeekDate(round, week) {

    const actualWeek =
        getRoundStartWeek(round) +
        (week - 1);

    const date =
        new Date(startFriday);

    date.setDate(
        startFriday.getDate() +
        actualWeek * 7
    );

    return date;
}


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

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );
}


function getPunter(round, week) {

    const actualWeek =
        getRoundStartWeek(round) +
        (week - 1);

    return players[
        actualWeek %
        players.length
    ];
}


// ====================================
// CURRENT ROUND DISPLAY
// ====================================

function displayCurrentRound() {

    const currentRoundElement =
        document.getElementById(
            "current-round"
        );

    if (currentRoundElement) {

        currentRoundElement.textContent =
            currentRound;
    }


    const weekElement =
        document.getElementById(
            "week-number"
        );

    if (weekElement) {

        weekElement.textContent =
            formatDate(
                bettingFriday
            );
    }


    const currentPlayerIndex =
        totalWeeksSinceStart %
        players.length;


    const nextPlayerIndex =
        (
            currentPlayerIndex + 1
        ) %
        players.length;


    const thisWeek =
        document.getElementById(
            "this-week"
        );

    if (thisWeek) {

        thisWeek.textContent =
            players[currentPlayerIndex];
    }


    const nextWeek =
        document.getElementById(
            "next-week"
        );

    if (nextWeek) {

        nextWeek.textContent =
            players[nextPlayerIndex];
    }
}


// ====================================
// ROUND SELECTOR BUILDER
// ====================================

function populateRoundSelector(
    selector,
    selectedRound
) {

    if (!selector) {
        return;
    }


    selector.innerHTML = "";


    for (
        let round = 1;
        round <= MAX_ROUNDS;
        round++
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            round;

        option.textContent =
            "Round " + round;

        selector.appendChild(
            option
        );
    }


    selector.value =
        selectedRound;
}


// ====================================
// BOOKIE ROUND SELECTOR
// ====================================

function setupBookieSelector() {

    const table =
        document.getElementById(
            "betting-results"
        );

    if (!table) {
        return;
    }


    /*
     Create selector above the
     Bookie Input table.
    */

    const heading =
        table.closest(".table-container")
            ?.previousElementSibling;


    if (
        heading &&
        heading.dataset.selectorAdded
    ) {
        return;
    }


    if (heading) {

        heading.dataset.selectorAdded =
            "true";


        const controls =
            document.createElement(
                "div"
            );

        controls.className =
            "standings-controls";


        controls.innerHTML = `

            <label for="bookie-round-selector">
                <strong>Enter Results For:</strong>
            </label>

            <select id="bookie-round-selector">
            </select>

        `;


        heading.insertAdjacentElement(
            "afterend",
            controls
        );
    }


    const selector =
        document.getElementById(
            "bookie-round-selector"
        );


    populateRoundSelector(
        selector,
        currentRound
    );


    if (selector) {

        selector.addEventListener(
            "change",
            async function() {

                selectedBookieRound =
                    Number(
                        this.value
                    );

                await buildBookieTable(
                    selectedBookieRound
                );

            }
        );
    }
}


// ====================================
// BUILD BOOKIE TABLE
// ====================================

async function buildBookieTable(
    round
) {

    const table =
        document.getElementById(
            "betting-results"
        );

    if (!table) {
        return;
    }


    table.innerHTML = "";


    /*
     Load existing results for
     the selected round.
    */

    const {
        data,
        error
    } =
        await supabaseClient
            .from("betting_results")
            .select("*")
            .eq("round", round)
            .order(
                "week",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error loading selected round:",
            error
        );

        return;
    }


    for (
        let week = 1;
        week <= WEEKS_PER_ROUND;
        week++
    ) {

        const existing =
            data.find(
                function(bet) {

                    return (
                        Number(
                            bet.week
                        ) === week
                    );

                }
            );


        const date =
            getWeekDate(
                round,
                week
            );


        const punter =
            getPunter(
                round,
                week
            );


        const row =
            document.createElement(
                "tr"
            );


        const odds =
            existing &&
            existing.odds !== null &&
            existing.odds !== undefined

                ? existing.odds

                : "";


        let result =
            existing
                ? (
                    existing.result ||
                    ""
                )
                    .toString()
                    .trim()
                    .toUpperCase()

                : "";


        /*
         Convert old Win/Loss records
         to W/L automatically.
        */

        if (result === "WIN") {
            result = "W";
        }

        if (
            result === "LOSS" ||
            result === "LOSE"
        ) {
            result = "L";
        }


        const winnings =
            calculateWinnings(
                odds,
                result
            );


        row.innerHTML = `

            <td>
                ${formatDate(date)}
            </td>

            <td>
                ${punter}
            </td>

            <td>
                $${STAKE}
            </td>

            <td>
                <input
                    type="number"
                    class="odds"
                    min="1"
                    step="0.01"
                    placeholder="2.50"
                    value="${odds}"
                    data-round="${round}"
                    data-week="${week}"
                >
            </td>

            <td>
                <select
                    class="result"
                    data-round="${round}"
                    data-week="${week}"
                >

                    <option value="">
                        -
                    </option>

                    <option
                        value="W"
                        ${result === "W" ? "selected" : ""}
                    >
                        W
                    </option>

                    <option
                        value="L"
                        ${result === "L" ? "selected" : ""}
                    >
                        L
                    </option>

                </select>
            </td>

            <td>
                <span
                    class="winnings"
                    data-week="${week}"
                >
                    $${winnings.toFixed(2)}
                </span>
            </td>

        `;


        table.appendChild(row);
    }


    /*
     Add event listeners after
     table has been created.
    */

    table
        .querySelectorAll(".odds")
        .forEach(
            function(input) {

                input.addEventListener(
                    "change",
                    function() {

                        const week =
                            Number(
                                this.dataset.week
                            );


                        updateDisplayedWinnings(
                            week
                        );


                        saveBet(
                            round,
                            week
                        );

                    }
                );

            }
        );


    table
        .querySelectorAll(".result")
        .forEach(
            function(input) {

                input.addEventListener(
                    "change",
                    function() {

                        const week =
                            Number(
                                this.dataset.week
                            );


                        updateDisplayedWinnings(
                            week
                        );


                        saveBet(
                            round,
                            week
                        );

                    }
                );

            }
        );
}


// ====================================
// CALCULATE WINNINGS
// ====================================

function calculateWinnings(
    odds,
    result
) {

    if (
        result !== "W"
    ) {
        return 0;
    }


    if (
        !odds ||
        Number(odds) <= 0
    ) {
        return 0;
    }


    return (
        STAKE *
        Number(odds)
    );
}


// ====================================
// UPDATE WINNINGS DISPLAY
// ====================================

function updateDisplayedWinnings(
    week
) {

    const oddsInput =
        document.querySelector(
            `.odds[data-week="${week}"]`
        );


    const resultInput =
        document.querySelector(
            `.result[data-week="${week}"]`
        );


    const winningsDisplay =
        document.querySelector(
            `.winnings[data-week="${week}"]`
        );


    if (
        !oddsInput ||
        !resultInput ||
        !winningsDisplay
    ) {
        return;
    }


    const winnings =
        calculateWinnings(
            Number(
                oddsInput.value
            ),
            resultInput.value
        );


    winningsDisplay.textContent =
        "$" +
        winnings.toFixed(2);
}


// ====================================
// SAVE BET
// ====================================

async function saveBet(
    round,
    week
) {

    const oddsInput =
        document.querySelector(
            `.odds[data-week="${week}"]`
        );


    const resultInput =
        document.querySelector(
            `.result[data-week="${week}"]`
        );


    if (
        !oddsInput ||
        !resultInput
    ) {
        return;
    }


    const odds =
        oddsInput.value === ""
            ? null
            : Number(
                oddsInput.value
            );


    const result =
        resultInput.value;


    const winnings =
        calculateWinnings(
            odds,
            result
        );


    const date =
        getWeekDate(
            round,
            week
        );


    const friday =
        formatDatabaseDate(
            date
        );


    const punter =
        getPunter(
            round,
            week
        );


    /*
     Check whether this
     round/week already exists.
    */

    const {
        data: existing,
        error: findError
    } =
        await supabaseClient
            .from("betting_results")
            .select("id")
            .eq("round", round)
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

        round:
            round,

        week:
            week,

        friday:
            friday,

        punter:
            punter,

        result:
            result,

        odds:
            odds,

        winnings:
            winnings

    };


    if (existing) {

        const {
            error
        } =
            await supabaseClient
                .from("betting_results")
                .update(
                    betData
                )
                .eq(
                    "id",
                    existing.id
                );


        if (error) {

            console.error(
                "Error updating bet:",
                error
            );

            return;
        }

    } else {

        const {
            error
        } =
            await supabaseClient
                .from("betting_results")
                .insert(
                    betData
                );


        if (error) {

            console.error(
                "Error saving bet:",
                error
            );

            return;
        }
    }


    await refreshAll();
}


// ====================================
// LOAD ALL RESULTS
// ====================================

async function loadAllResults() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("betting_results")
            .select("*")
            .order(
                "round",
                {
                    ascending: true
                }
            )
            .order(
                "week",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error loading results:",
            error
        );

        return [];
    }


    return data || [];
}


// ====================================
// KITTY
// ====================================

function calculateKitty(
    data
) {

    let kitty =
        STARTING_KITTY;


    let totalWinnings =
        0;


    data.forEach(
        function(bet) {

            const result =
                (
                    bet.result ||
                    ""
                )
                    .toString()
                    .trim()
                    .toUpperCase();


            if (
                result !== "W" &&
                result !== "L"
            ) {
                return;
            }


            const winnings =
                Number(
                    bet.winnings
                ) || 0;


            kitty +=
                UNBET_AMOUNT -
                STAKE +
                winnings;


            if (
                result === "W"
            ) {

                totalWinnings +=
                    winnings;
            }

        }
    );


    return {
        kitty:
            kitty,

        totalWinnings:
            totalWinnings
    };
}


// ====================================
// UPDATE KITTY DISPLAY
// ====================================

function updateKitty(
    data
) {

    const stats =
        calculateKitty(
            data
        );


    const kitty =
        document.getElementById(
            "total-kitty"
        );


    if (kitty) {

        kitty.textContent =
            "$" +
            stats.kitty.toFixed(0);
    }


    const winnings =
        document.getElementById(
            "total-winnings"
        );


    if (winnings) {

        winnings.textContent =
            stats.totalWinnings.toFixed(0);
    }


    const weeks =
        document.getElementById(
            "weeks-completed"
        );


    if (weeks) {

        const completed =
            data.filter(
                function(bet) {

                    if (
                        Number(
                            bet.round
                        ) !==
                        currentRound
                    ) {
                        return false;
                    }


                    const result =
                        (
                            bet.result ||
                            ""
                        )
                            .toString()
                            .trim()
                            .toUpperCase();


                    return (
                        result === "W" ||
                        result === "L"
                    );

                }
            ).length;


        weeks.textContent =
            completed;
    }
}


// ====================================
// STANDINGS
// ====================================

function updateStandings(
    data
) {

    const standings = {};


    players.forEach(
        function(player) {

            standings[player] = {

                wins:
                    0,

                totalWinnings:
                    0,

                results:
                    []

            };

        }
    );


    data.forEach(
        function(bet) {

            const player =
                standings[
                    bet.punter
                ];


            if (!player) {
                return;
            }


            let result =
                (
                    bet.result ||
                    ""
                )
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
                result !== "W" &&
                result !== "L"
            ) {
                return;
            }


            const winnings =
                Number(
                    bet.winnings
                ) || 0;


            player.results.push({

                round:
                    Number(
                        bet.round
                    ),

                result:
                    result

            });


            if (
                result === "W"
            ) {

                player.wins++;

                player.totalWinnings +=
                    winnings;
            }

        }
    );


    /*
     Calculate streaks by ROUND.

     Each player only has one bet
     per round.
    */

    players.forEach(
        function(player) {

            const stats =
                standings[player];


            stats.results.sort(
                function(a, b) {

                    return (
                        a.round -
                        b.round
                    );

                }
            );


            let currentStreak = 0;
            let bestStreak = 0;


            stats.results.forEach(
                function(bet) {

                    if (
                        bet.result === "W"
                    ) {

                        currentStreak++;

                        if (
                            currentStreak >
                            bestStreak
                        ) {

                            bestStreak =
                                currentStreak;
                        }

                    } else {

                        currentStreak =
                            0;
                    }

                }
            );


            stats.currentStreak =
                currentStreak;

            stats.bestStreak =
                bestStreak;

        }
    );


    const selector =
        document.getElementById(
            "standings-sort"
        );


    const sortBy =
        selector
            ? selector.value
            : "wins";


    const sortedPlayers =
        [...players].sort(
            function(a, b) {

                if (
                    sortBy ===
                    "winnings"
                ) {

                    if (
                        standings[b]
                            .totalWinnings !==
                        standings[a]
                            .totalWinnings
                    ) {

                        return (
                            standings[b]
                                .totalWinnings -
                            standings[a]
                                .totalWinnings
                        );
                    }


                    return (
                        standings[b].wins -
                        standings[a].wins
                    );
                }


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
                    standings[b]
                        .totalWinnings -
                    standings[a]
                        .totalWinnings
                );

            }
        );


    const table =
        document.getElementById(
            "standings-table"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    sortedPlayers.forEach(
        function(player) {

            const stats =
                standings[player];


            const streak =
                stats.currentStreak >= 2

                    ? "🔥 " +
                      stats.currentStreak

                    : "-";


            const best =
                stats.bestStreak > 0
                    ? stats.bestStreak
                    : "-";


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    <strong>
                        ${player}
                    </strong>
                </td>

                <td>
                    ${stats.wins}
                </td>

                <td>
                    $${stats.totalWinnings.toFixed(2)}
                </td>

                <td>
                    ${streak}
                </td>

                <td>
                    ${best}
                </td>

            `;


            table.appendChild(row);

        }
    );
}


// ====================================
// STANDINGS SORT
// ====================================

function setupStandingsSort() {

    const selector =
        document.getElementById(
            "standings-sort"
        );


    if (!selector) {
        return;
    }


    selector.addEventListener(
        "change",
        async function() {

            const data =
                await loadAllResults();

            updateStandings(
                data
            );

        }
    );
}


// ====================================
// ROUND HISTORY
// ====================================

function setupHistorySelector() {

    const selector =
        document.getElementById(
            "round-selector"
        );


    if (!selector) {
        return;
    }


    populateRoundSelector(
        selector,
        currentRound
    );


    selector.addEventListener(
        "change",
        async function() {

            const data =
                await loadAllResults();


            displayRoundHistory(
                data,
                Number(
                    this.value
                )
            );

        }
    );
}


// ====================================
// DISPLAY ROUND HISTORY
// ====================================

function displayRoundHistory(
    data,
    round
) {

    const container =
        document.getElementById(
            "round-history"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const bets =
        data
            .filter(
                function(bet) {

                    return (
                        Number(
                            bet.round
                        ) === round
                    );

                }
            )
            .sort(
                function(a, b) {

                    return (
                        Number(a.week) -
                        Number(b.week)
                    );

                }
            );


    let wins = 0;
    let totalWinnings = 0;


    bets.forEach(
        function(bet) {

            const result =
                (
                    bet.result ||
                    ""
                )
                    .toString()
                    .trim()
                    .toUpperCase();


            if (
                result === "W"
            ) {

                wins++;
            }


            totalWinnings +=
                Number(
                    bet.winnings
                ) || 0;

        }
    );


    let htmlRows = "";


    for (
        let week = 1;
        week <= WEEKS_PER_ROUND;
        week++
    ) {

        const bet =
            bets.find(
                function(item) {

                    return (
                        Number(
                            item.week
                        ) === week
                    );

                }
            );


        const date =
            getWeekDate(
                round,
                week
            );


        const punter =
            getPunter(
                round,
                week
            );


        let result = "-";
        let odds = "-";
        let winnings = 0;


        if (bet) {

            result =
                (
                    bet.result ||
                    "-"
                )
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
                bet.odds !== null &&
                bet.odds !== undefined
            ) {

                odds =
                    Number(
                        bet.odds
                    ).toFixed(2);
            }


            winnings =
                Number(
                    bet.winnings
                ) || 0;
        }


        htmlRows += `

            <tr>

                <td>
                    ${week}
                </td>

                <td>
                    ${formatDate(date)}
                </td>

                <td>
                    ${punter}
                </td>

                <td>
                    $${STAKE}
                </td>

                <td>
                    ${odds}
                </td>

                <td>
                    ${result}
                </td>

                <td>
                    $${winnings.toFixed(2)}
                </td>

            </tr>

        `;
    }


    const completed =
        bets.filter(
            function(bet) {

                const result =
                    (
                        bet.result ||
                        ""
                    )
                        .toString()
                        .trim()
                        .toUpperCase();


                return (
                    result === "W" ||
                    result === "L"
                );

            }
        ).length;


    const section =
        document.createElement(
            "div"
        );


    section.className =
        "history-round";


    section.innerHTML = `

        <h3>
            Round ${round}
            ${
                completed ===
                WEEKS_PER_ROUND

                    ? "Completed"

                    : "In Progress"
            }
        </h3>

        <p>

            <strong>
                Weeks Completed:
            </strong>

            ${completed} / ${WEEKS_PER_ROUND}

        </p>

        <p>

            <strong>
                Wins:
            </strong>

            ${wins}

            &nbsp;&nbsp;

            <strong>
                Total Winnings:
            </strong>

            $${totalWinnings.toFixed(2)}

        </p>


        <div class="table-container">

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
                    </tr>

                </thead>

                <tbody>

                    ${htmlRows}

                </tbody>

            </table>

        </div>

    `;


    container.appendChild(
        section
    );
}


// ====================================
// CURRENT BET CARD
// ====================================

function updateCurrentBetCard(
    data
) {

    const currentBet =
        data.find(
            function(bet) {

                return (
                    Number(
                        bet.round
                    ) ===
                    currentRound &&

                    Number(
                        bet.week
                    ) ===
                    currentWeek
                );

            }
        );


    const player =
        document.getElementById(
            "current-bet-player"
        );


    const odds =
        document.getElementById(
            "current-bet-odds"
        );


    const result =
        document.getElementById(
            "current-bet-result"
        );


    const winnings =
        document.getElementById(
            "current-bet-winnings"
        );


    if (player) {

        player.textContent =
            currentBet
                ? currentBet.punter
                : getPunter(
                    currentRound,
                    currentWeek
                );
    }


    if (odds) {

        odds.textContent =
            currentBet &&
            currentBet.odds !== null &&
            currentBet.odds !== undefined

                ? Number(
                    currentBet.odds
                ).toFixed(2)

                : "-";
    }


    if (result) {

        let value =
            currentBet
                ? currentBet.result
                : "";


        value =
            (
                value ||
                ""
            )
                .toString()
                .trim()
                .toUpperCase();


        if (value === "WIN") {
            value = "W";
        }


        if (
            value === "LOSS" ||
            value === "LOSE"
        ) {
            value = "L";
        }


        result.textContent =
            value || "-";
    }


    if (winnings) {

        winnings.textContent =
            currentBet
                ? (
                    Number(
                        currentBet.winnings
                    ) || 0
                ).toFixed(2)

                : "0.00";
    }
}


// ====================================
// REFRESH EVERYTHING
// ====================================

async function refreshAll() {

    const data =
        await loadAllResults();


    updateKitty(
        data
    );


    updateStandings(
        data
    );


    updateCurrentBetCard(
        data
    );


    const historySelector =
        document.getElementById(
            "round-selector"
        );


    if (historySelector) {

        displayRoundHistory(
            data,
            Number(
                historySelector.value
            )
        );
    }
}


// ====================================
// START APP
// ====================================

displayCurrentRound();

setupStandingsSort();

setupBookieSelector();

setupHistorySelector();

buildBookieTable(
    selectedBookieRound
);

refreshAll();