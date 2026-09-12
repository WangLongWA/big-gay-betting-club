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
// ROUND SETTINGS
// ====================================

const WEEKS_PER_ROUND = 6;

const STAKE = 20;

const CONTRIBUTION = 30;

const UNBET_AMOUNT =
    CONTRIBUTION - STAKE;

const STARTING_KITTY = 180;


// First Friday of Round 1

const startFriday =
    new Date(2026, 8, 4);

startFriday.setHours(0, 0, 0, 0);


// ====================================
// GET CURRENT FRIDAY
// ====================================

function getCurrentFriday() {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const day =
        today.getDay();

    // Friday = 5
    // Work backwards to the most
    // recent Friday.

    const daysSinceFriday =
        (day + 2) % 7;

    const friday =
        new Date(today);

    friday.setDate(
        today.getDate() -
        daysSinceFriday
    );

    return friday;
}


const bettingFriday =
    getCurrentFriday();


// ====================================
// WORK OUT ROUND / WEEK
// ====================================

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
// CURRENT PUNTER
// ====================================

const currentPlayerIndex =
    totalWeeksSinceStart %
    players.length;


const nextPlayerIndex =
    (
        currentPlayerIndex + 1
    ) %
    players.length;


const currentPlayer =
    players[currentPlayerIndex];


const nextPlayer =
    players[nextPlayerIndex];


// ====================================
// DATE FUNCTIONS
// ====================================

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


// ====================================
// DISPLAY CURRENT ROUND
// ====================================

function displayCurrentRound() {

    const roundElement =
        document.getElementById(
            "current-round"
        );

    if (roundElement) {

        roundElement.textContent =
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


    const thisWeekElement =
        document.getElementById(
            "this-week"
        );

    if (thisWeekElement) {

        thisWeekElement.textContent =
            currentPlayer;
    }


    const nextWeekElement =
        document.getElementById(
            "next-week"
        );

    if (nextWeekElement) {

        nextWeekElement.textContent =
            nextPlayer;
    }
}


// ====================================
// BUILD SCHEDULE
// ====================================

function buildSchedule() {

    const schedule =
        document.getElementById(
            "round-schedule"
        );

    if (!schedule) {
        return;
    }

    schedule.innerHTML = "";


    const roundStartWeek =
        totalWeeksSinceStart -
        (currentWeek - 1);


    for (
        let i = 0;
        i < WEEKS_PER_ROUND;
        i++
    ) {

        const actualWeek =
            roundStartWeek + i;


        const weekDate =
            new Date(startFriday);


        weekDate.setDate(
            startFriday.getDate() +
            (
                actualWeek * 7
            )
        );


        const punter =
            players[
                actualWeek %
                players.length
            ];


        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${formatDate(weekDate)}</td>
            <td>${punter}</td>
        `;


        schedule.appendChild(row);
    }
}


// ====================================
// BUILD BOOKIE INPUT
// ====================================

function buildBettingTable() {

    const tableBody =
        document.getElementById(
            "betting-results"
        );

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    const roundStartWeek =
        totalWeeksSinceStart -
        (currentWeek - 1);


    for (
        let i = 0;
        i < WEEKS_PER_ROUND;
        i++
    ) {

        const actualWeek =
            roundStartWeek + i;


        const weekDate =
            new Date(startFriday);


        weekDate.setDate(
            startFriday.getDate() +
            (
                actualWeek * 7
            )
        );


        const punter =
            players[
                actualWeek %
                players.length
            ];


        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td>
                ${formatDate(weekDate)}
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
                    data-week="${i + 1}"
                >
            </td>

            <td>
                <select
                    class="result"
                    data-week="${i + 1}"
                >
                    <option value="">
                        -
                    </option>

                    <option value="W">
                        W
                    </option>

                    <option value="L">
                        L
                    </option>
                </select>
            </td>

            <td>
                <span
                    class="winnings"
                    data-week="${i + 1}"
                >
                    $0.00
                </span>
            </td>

        `;


        tableBody.appendChild(row);
    }


    // Odds changed

    document
        .querySelectorAll(".odds")
        .forEach(function(input) {

            input.addEventListener(
                "change",
                function() {

                    const index =
                        Number(
                            this.dataset.week
                        ) - 1;


                    updateDisplayedWinnings(
                        index
                    );


                    saveBet(index);
                }
            );

        });


    // Result changed

    document
        .querySelectorAll(".result")
        .forEach(function(input) {

            input.addEventListener(
                "change",
                function() {

                    const index =
                        Number(
                            this.dataset.week
                        ) - 1;


                    updateDisplayedWinnings(
                        index
                    );


                    saveBet(index);
                }
            );

        });
}


// ====================================
// CALCULATE PAYOUT
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
// UPDATE PAYOUT ON SCREEN
// ====================================

function updateDisplayedWinnings(
    index
) {

    const oddsInputs =
        document.querySelectorAll(
            ".odds"
        );


    const resultInputs =
        document.querySelectorAll(
            ".result"
        );


    const winningsDisplays =
        document.querySelectorAll(
            ".winnings"
        );


    const odds =
        oddsInputs[index]
            ? Number(
                oddsInputs[index].value
            )
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


    if (
        winningsDisplays[index]
    ) {

        winningsDisplays[index]
            .textContent =
            "$" +
            winnings.toFixed(2);
    }
}

// ====================================
// STANDINGS SORT SELECTOR
// ====================================

const standingsSort =
    document.getElementById(
        "standings-sort"
    );

if (standingsSort) {

    standingsSort.addEventListener(
        "change",
        async function() {

            const data =
                await loadAllResults();

            updateStandings(data);

        }
    );

}

// ====================================
// LOAD CURRENT ROUND
// ====================================

async function loadCurrentRound() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "betting_results"
            )
            .select("*")
            .eq(
                "round",
                currentRound
            )
            .order(
                "week",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error loading current round:",
            error
        );

        return;
    }


    const oddsInputs =
        document.querySelectorAll(
            ".odds"
        );


    const resultInputs =
        document.querySelectorAll(
            ".result"
        );


    data.forEach(function(bet) {

        const index =
            Number(
                bet.week
            ) - 1;


        if (
            oddsInputs[index]
        ) {

            if (
                bet.odds !== null &&
                bet.odds !== undefined
            ) {

                oddsInputs[index]
                    .value =
                    bet.odds;
            }
        }


        if (
            resultInputs[index]
        ) {

            let result =
                (
                    bet.result ||
                    ""
                )
                .toString()
                .trim()
                .toUpperCase();


            // Convert old data

            if (
                result === "WIN"
            ) {
                result = "W";
            }


            if (
                result === "LOSS" ||
                result === "LOSE"
            ) {
                result = "L";
            }


            resultInputs[index]
                .value =
                result;
        }


        updateDisplayedWinnings(
            index
        );

    });


    await refreshAllDisplays();
}


// ====================================
// SAVE BET
// ====================================

async function saveBet(index) {

    const oddsInputs =
        document.querySelectorAll(
            ".odds"
        );


    const resultInputs =
        document.querySelectorAll(
            ".result"
        );


    const odds =
        oddsInputs[index]
            ? Number(
                oddsInputs[index].value
            )
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
        (
            actualWeekNumber * 7
        )
    );


    const friday =
        formatDatabaseDate(
            weekDate
        );


    const punter =
        players[
            actualWeekNumber %
            players.length
        ];


    const {
        data: existing,
        error: findError
    } =
        await supabaseClient
            .from(
                "betting_results"
            )
            .select("id")
            .eq(
                "round",
                currentRound
            )
            .eq(
                "week",
                week
            )
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
            currentRound,

        week:
            week,

        friday:
            friday,

        punter:
            punter,

        result:
            result,

        odds:
            odds || null,

        winnings:
            winnings

    };


    // UPDATE

    if (existing) {

        const {
            error
        } =
            await supabaseClient
                .from(
                    "betting_results"
                )
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

    }


    // INSERT

    else {

        const {
            error
        } =
            await supabaseClient
                .from(
                    "betting_results"
                )
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


    await refreshAllDisplays();
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
            .from(
                "betting_results"
            )
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
// CALCULATE LIFETIME KITTY
// ====================================

function calculateKitty(
    data
) {

    let kitty =
        STARTING_KITTY;


    let totalWinnings =
        0;


    let completedBets =
        0;


    data.forEach(function(bet) {

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


        /*
         Each player contributes $30.

         $20 is bet.
         $10 remains in kitty.

         Therefore:

         Loss:
         -$20 stake + $10 saved
         = -$10

         Win:
         -$20 stake
         + $10 saved
         + payout

         = payout - $10
        */

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


        completedBets++;

    });


    return {

        kitty:
            kitty,

        totalWinnings:
            totalWinnings,

        completedBets:
            completedBets

    };
}


// ====================================
// UPDATE KITTY
// ====================================

function updateKittyDisplay(
    data
) {

    const stats =
        calculateKitty(
            data
        );


    const kittyElement =
        document.getElementById(
            "total-kitty"
        );


    if (
        kittyElement
    ) {

        kittyElement.textContent =
            "$" +
            stats.kitty.toFixed(0);
    }


    const winningsElement =
        document.getElementById(
            "total-winnings"
        );


    if (
        winningsElement
    ) {

        winningsElement.textContent =
            stats.totalWinnings.toFixed(0);
    }


    const weeksElement =
        document.getElementById(
            "weeks-completed"
        );


    if (
        weeksElement
    ) {

        // Only current round

        const currentRoundBets =
            data.filter(
                function(bet) {

                    return (
                        Number(
                            bet.round
                        ) ===
                        currentRound
                    );

                }
            );


        const completed =
            currentRoundBets.filter(
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


        weeksElement.textContent =
            completed;
    }
}


// ====================================
// LIFETIME STANDINGS
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
                    [],

                currentStreak:
                    0,

                bestStreak:
                    0

            };

        }
    );


    data.forEach(
        function(bet) {

            if (
                !standings[
                    bet.punter
                ]
            ) {
                return;
            }


            const player =
                standings[
                    bet.punter
                ];


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


            player.results.push({

                round:
                    Number(
                        bet.round
                    ),

                week:
                    Number(
                        bet.week
                    ),

                result:
                    result,

                winnings:
                    winnings

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


    // ====================================
    // STREAKS
    //
    // IMPORTANT:
    // Each player only bets ONCE per round.
    // Streaks therefore work by ROUND.
    // ====================================

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


            let currentStreak =
                0;


            let bestStreak =
                0;


            let lastRound =
                null;


            stats.results.forEach(
                function(bet) {

                    if (
                        lastRound !== null &&
                        bet.round ===
                        lastRound
                    ) {

                        // Same round.
                        // Shouldn't happen because
                        // there is one bet per player
                        // per round.

                        return;
                    }


                    if (
                        bet.result ===
                        "W"
                    ) {

                        currentStreak++;


                        if (
                            currentStreak >
                            bestStreak
                        ) {

                            bestStreak =
                                currentStreak;
                        }

                    }

                    else {

                        currentStreak =
                            0;
                    }


                    lastRound =
                        bet.round;

                }
            );


            /*
             We need current streak to represent
             the most recent consecutive rounds.

             If the latest recorded bet isn't
             the most recent round that player
             has played, it still represents their
             current streak from their latest result.
            */

            stats.currentStreak =
                currentStreak;

            stats.bestStreak =
                bestStreak;

        }
    );


    // ====================================
    // SORT STANDINGS
    //
    // 1. Most wins
    // 2. Highest winnings
    // 3. Original player order
    // ====================================

// ====================================
// SORT STANDINGS
// ====================================

const sortSelector =
    document.getElementById("standings-sort");

const sortBy =
    sortSelector
        ? sortSelector.value
        : "wins";


const sortedPlayers =
    [...players].sort(function(a, b) {

        if (sortBy === "winnings") {

            if (
                standings[b].totalWinnings !==
                standings[a].totalWinnings
            ) {

                return (
                    standings[b].totalWinnings -
                    standings[a].totalWinnings
                );

            }

            // Tie breaker = most wins

            return (
                standings[b].wins -
                standings[a].wins
            );
        }


        // Default = most wins

        if (
            standings[b].wins !==
            standings[a].wins
        ) {

            return (
                standings[b].wins -
                standings[a].wins
            );
        }

        // Tie breaker = most winnings

        return (
            standings[b].totalWinnings -
            standings[a].totalWinnings
        );

    });

    // ====================================
    // DISPLAY
    // ====================================

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


            const currentStreak =
                stats.currentStreak >
                0

                    ? "HOT " +
                      stats.currentStreak

                    : "-";


            const bestStreak =
                stats.bestStreak >
                0

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
                    ${currentStreak}
                </td>

                <td>
                    ${bestStreak}
                </td>

            `;


            table.appendChild(row);

        }
    );
}


// ====================================
// BUILD ROUND SELECTOR
// ====================================

function buildRoundSelector(
    data
) {

    const selector =
        document.getElementById(
            "round-selector"
        );


    if (!selector) {
        return;
    }


    const rounds =
        [
            ...new Set(
                data.map(
                    function(bet) {

                        return Number(
                            bet.round
                        );

                    }
                )
            )
        ];


    // Always include current round

    if (
        !rounds.includes(
            currentRound
        )
    ) {

        rounds.push(
            currentRound
        );
    }


    rounds.sort(
        function(a, b) {

            return b - a;

        }
    );


    selector.innerHTML = "";


    rounds.forEach(
        function(round) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                round;


            option.textContent =
                "Round " +
                round;


            selector.appendChild(
                option
            );

        }
    );


    // Default to current round

    selector.value =
        currentRound;


    selector.onchange =
        function() {

            displaySelectedRound(
                data,
                Number(
                    this.value
                )
            );

        };


    displaySelectedRound(
        data,
        currentRound
    );
}


// ====================================
// DISPLAY SELECTED ROUND
// ====================================

function displaySelectedRound(
    data,
    selectedRound
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
                        ) ===
                        selectedRound
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


    const wins =
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


                return result === "W";

            }
        ).length;


    const totalWinnings =
        bets.reduce(
            function(total, bet) {

                return (
                    total +
                    (
                        Number(
                            bet.winnings
                        ) || 0
                    )
                );

            },
            0
        );


    // Calculate kitty immediately
    // before this round

    let kitty =
        STARTING_KITTY;


    data
        .filter(
            function(bet) {

                return (
                    Number(
                        bet.round
                    ) <
                    selectedRound
                );

            }
        )
        .sort(
            function(a, b) {

                if (
                    Number(a.round) !==
                    Number(b.round)
                ) {

                    return (
                        Number(a.round) -
                        Number(b.round)
                    );

                }


                return (
                    Number(a.week) -
                    Number(b.week)
                );

            }
        )
        .forEach(
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
                    result === "W" ||
                    result === "L"
                ) {

                    kitty +=
                        UNBET_AMOUNT -
                        STAKE +
                        (
                            Number(
                                bet.winnings
                            ) || 0
                        );

                }

            }
        );


    const startingKitty =
        kitty;


    // ====================================
    // ROUND TABLE
    // ====================================

    let tableRows =
        "";


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


            let resultDisplay =
                "-";


            if (
                result === "W"
            ) {

                resultDisplay =
                    "<strong>W</strong>";

            }


            if (
                result === "L"
            ) {

                resultDisplay =
                    "<strong>L</strong>";

            }


            const winnings =
                Number(
                    bet.winnings
                ) || 0;


            const odds =
                bet.odds !== null &&
                bet.odds !== undefined

                    ? Number(
                        bet.odds
                    ).toFixed(2)

                    : "-";


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


            if (
                result === "W" ||
                result === "L"
            ) {

                kitty +=
                    UNBET_AMOUNT -
                    STAKE +
                    winnings;

            }


            tableRows += `

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

        }
    );


    const section =
        document.createElement(
            "div"
        );


    section.className =
        "history-round";


    section.innerHTML = `

        <h3>
            Round ${selectedRound}
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

            &nbsp;&nbsp;

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

        <p>

            <strong>
                Starting Kitty:
            </strong>

            $${startingKitty.toFixed(0)}

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

                ${
                    tableRows ||
                    `
                    <tr>
                        <td colspan="8">
                            No bets recorded yet.
                        </td>
                    </tr>
                    `
                }

            </tbody>

        </table>

        <p>

            <strong>
                Ending Kitty:
            </strong>

            $${kitty.toFixed(0)}

        </p>

    `;


    container.appendChild(
        section
    );
}


// ====================================
// UPDATE THIS WEEK'S BET
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


    const playerElement =
        document.getElementById(
            "current-bet-player"
        );


    const oddsElement =
        document.getElementById(
            "current-bet-odds"
        );


    const resultElement =
        document.getElementById(
            "current-bet-result"
        );


    const winningsElement =
        document.getElementById(
            "current-bet-winnings"
        );


    if (
        playerElement
    ) {

        playerElement.textContent =
            currentBet
                ? currentBet.punter
                : currentPlayer;

    }


    if (
        oddsElement
    ) {

        oddsElement.textContent =
            currentBet &&
            currentBet.odds !== null &&
            currentBet.odds !== undefined

                ? Number(
                    currentBet.odds
                ).toFixed(2)

                : "-";

    }


    if (
        resultElement
    ) {

        let result =
            currentBet
                ? currentBet.result
                : "";


        result =
            (
                result ||
                ""
            )
            .toString()
            .trim()
            .toUpperCase();


        if (
            result === "WIN"
        ) {
            result = "W";
        }


        if (
            result === "LOSS" ||
            result === "LOSE"
        ) {
            result = "L";
        }


        resultElement.textContent =
            result || "-";

    }


    if (
        winningsElement
    ) {

        winningsElement.textContent =
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

async function refreshAllDisplays() {

    const data =
        await loadAllResults();


    updateKittyDisplay(
        data
    );


    updateStandings(
        data
    );


    buildRoundSelector(
        data
    );


    updateCurrentBetCard(
        data
    );
}


// ====================================
// START APP
// ====================================

displayCurrentRound();

buildSchedule();

buildBettingTable();

loadCurrentRound();