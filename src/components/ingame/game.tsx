import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from "react";
import RollIcon from "../../../public/roll.png";
import HouseIcon from "../../../public/h.png";
import HotelIcon from "../../../public/ho.png";
import { Player } from "./../../assets/player.ts";
import { Socket } from "../../assets/sockets.ts";
import StreetCard, { StreetDisplayInfo, UtilitiesDisplayInfo, RailroadDisplayInfo, translateGroup } from "./streetCard.tsx";
import monopolyJSON from "../../assets/monopoly.json";
import ChacneCard, { ChanceDisplayInfo } from "./specialCards.tsx";
import { MonopolyCookie, MonopolySettings, GameTrading, MonopolyMode } from "../../assets/types.ts";
import Slider from "../utils/slider.tsx";
import { CookieManager } from "../../assets/cookieManager.ts";
interface MonopolyGameProps {
    players: Array<Player>;
    myTurn: boolean;
    socket: Socket;
    clickedOnBoard: (a: number) => void;
    tradeObj?: undefined | GameTrading | boolean;
    tradeApi: {
        onSelectPlayer: (pId: string) => void;
    };
    selectedMode: MonopolyMode;
}
export interface MonopolyGameRef {
    diceResults: (args: { l: [number, number]; time: number; onDone: () => void }) => void;
    freeDice: () => void;
    setStreet: (args: {
        location: number;
        rolls: number;
        onResponse: (action: "nothing" | "buy" | "someones" | "special_action" | "advance-buy", info: object) => void;
    }) => void;
    chorch: (
        element: {
            title: string;
            action: string;
            tileid: string;
            groupid?: undefined;
            rentmultiplier?: undefined;
            amount?: undefined;
            subaction?: undefined;
            count?: undefined;
            buildings?: undefined;
            hotels?: undefined;
        },
        is_chance: boolean,
        time: number
    ) => void;
    applyAnimation: (type: number) => void;
    showJailsButtons: (is_card: boolean) => void;
}

export interface g_SpecialAction {}
export type g_Buy = 0 | 1 | 2 | 3 | 4 | "h";

// Create the component with forwardRef
const MonopolyGame = forwardRef<MonopolyGameRef, MonopolyGameProps>((prop, ref) => {
    const propretyMap = new Map(
        monopolyJSON.properties.map((obj) => {
            return [obj.posistion ?? 0, obj];
        })
    );

    const [showDice, SetShowDice] = useState<boolean>(false);
    const [sended, SetSended] = useState<boolean>(false);
    const [showStreet, ShowStreet] = useState<boolean>(false);
    const [advnacedStreet, SetAdvancedStreet] = useState<boolean>(false);
    const [rotation, SetRotation] = useState<number>(0);
    const [scale, SetScale] = useState<number>(1);
    const [settings, SetSettings] = useState<MonopolySettings>();
    const [timer, SetTimer] = useState<number>(0);
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchStartY, setTouchStartY] = useState(0);
    const [isTouchMoving, setIsTouchMoving] = useState(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
        setIsTouchMoving(false);
    };

    const handleTouchMove = () => {
        setIsTouchMoving(true);
    };

    const handleTouchEnd = (e: React.TouchEvent, element: any) => {
        if (isTouchMoving) return; // Prevent click if user was scrolling

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        // Calculate distance moved
        const deltaX = Math.abs(touchEndX - touchStartX);
        const deltaY = Math.abs(touchEndY - touchStartY);

        // If movement is small enough, treat it as a tap
        if (deltaX < 10 && deltaY < 10) {
            handleClick(element);
        }
    };

    useEffect(() => {
        const settings_interval = setInterval(() => {
            SetSettings((JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string)) as MonopolyCookie).settings);
        }, 200);

        return () => {
            clearInterval(settings_interval);
        };
    }, [document.cookie]);

    const [streetDisplay, SetStreetDisplay] = useState<{}>({
        cardCost: -1,
        hotelsCost: -1,
        housesCost: -1,
        multpliedrent: [-1, -1, -1, -1, -1],
        rent: -1,
        rentWithColorSet: -1,
        title: "deafult",
        type: "electricity",
    } as UtilitiesDisplayInfo);

    const [streetType, SetStreetType] = useState<"Street" | "Utilities" | "Railroad" | "Chance" | "CommunityChest">("Street");

    function diceAnimation(a: number, b: number) {
        const element = document.getElementById("dice-panel") as HTMLDivElement;

        var bb = true;
        var t = -1;

        function randomCube() {
            var l = "./c";
            const numA = Math.floor(Math.random() * 6) + 1;
            const numB = Math.floor(Math.random() * 6) + 1;
            element.innerHTML = `
                <img src="${l}${numA}.png" />
                <img src="${l}${numB}.png" />
                
                `;
        }
        function anim() {
            if (bb) {
                randomCube();
                t += 1;
                requestAnimationFrame(anim);
            } else {
                var l = "./c";
                element.innerHTML = `
                <img src="${l}${a}.png" />
                <img src="${l}${b}.png" />
                `;
            }
        }
        setTimeout(() => {
            bb = false;
        }, 1000);

        requestAnimationFrame(anim);
    }
    function applyAnimation(type: number) {
        const element = document.querySelector("img#moneyAnimations");
        if (element === null) return;
        const imageElement = element as HTMLImageElement;
        imageElement.setAttribute("data-anim", "0");
        requestAnimationFrame(() => {
            imageElement.setAttribute("data-anim", type.toString());
            setTimeout(() => {
                imageElement.setAttribute("data-anim", "0");
            }, 1000);
        });
    }
    function swipeSound() {
        const _settings = (JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string)) as MonopolyCookie).settings;
        let audio = new Audio("./card.mp3");
        audio.volume = ((_settings?.audio[1] ?? 100) / 100) * ((_settings?.audio[0] ?? 100) / 100);
        audio.loop = false;
        audio.play();
    }

    useImperativeHandle(ref, () => ({
        diceResults: (args) => {
            diceAnimation(...args.l);
            SetShowDice(true);
            setTimeout(() => {
                SetShowDice(false);
                args.onDone();
            }, args.time);
        },
        freeDice: () => {
            const element = document.getElementById("dice-panel") as HTMLDivElement;
            element.innerHTML = "";
            SetSended(false);
        },
        setStreet: (args) => {
            // find data based on location
            const localPlayer = prop.players.filter((v) => v.id === prop.socket.id)[0];
            const x = propretyMap.get(args.location);

            if (x && args.location !== -1 && args.location < 40 && args.location >= 0) {
                function searchForButtons(
                    advanced: boolean,
                    location: number,
                    fartherInfo?: {
                        rolls: number;
                    }
                ) {
                    function clickSound() {
                        const _settings = (JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string)) as MonopolyCookie).settings;
                        let audio = new Audio("./click.mp3");
                        audio.volume = ((_settings?.audio[1] ?? 100) / 100) * ((_settings?.audio[0] ?? 100) / 100);
                        audio.loop = false;
                        audio.play();
                    }
                    function func() {
                        if (advanced) {
                            const b = document.querySelector("div#advanced-responses");

                            if (b) {
                                const _property = propretyMap.get(location);
                                if (!_property) return;
                                const divB = b as HTMLDivElement;
                                while (divB.firstChild) {
                                    divB.removeChild(divB.firstChild);
                                }
                                const propId = Array.from(new Map(localPlayer.properties.map((v, i) => [i, v])).entries()).filter(
                                    (v) => v[1].posistion === args.location
                                )[0][0];

                                function transformCount(v: 0 | 2 | 1 | 3 | 4 | "h") {
                                    switch (v) {
                                        case "h":
                                            return 5;

                                        default:
                                            return v;
                                    }
                                }
                                const count: number = transformCount(localPlayer.properties[propId].count);
                                for (let index = count + 1; index < 6; index++) {
                                    const myButton = document.createElement("button");
                                    if (index === 5) {
                                        myButton.innerHTML = `buy hotel`;
                                        // dont let someone buy hotel of not have a set of 4 houses
                                        myButton.disabled =
                                            index !== count + 1 ||
                                            (_property.ohousecost ?? 0) > (prop.players.filter((v) => v.id === prop.socket.id)[0].balance ?? 0);
                                        myButton.onclick = () => {
                                            args.onResponse("advance-buy", {
                                                state: index,
                                                money: 1,
                                            });
                                            ShowStreet(false);
                                        };
                                    } else {
                                        myButton.innerHTML = `buy ${index} house${index > 1 ? "s" : ""}`;
                                        myButton.onclick = () => {
                                            args.onResponse("advance-buy", {
                                                state: index,
                                                money: index - count,
                                            });
                                            ShowStreet(false);
                                        };
                                        myButton.disabled =
                                            (index - count) * (_property.housecost ?? 0) >
                                            (prop.players.filter((v) => v.id === prop.socket.id)[0].balance ?? 0);
                                    }
                                    divB.appendChild(myButton);
                                }
                                // last button of cancel
                                const continueButtons = document.createElement("button");
                                continueButtons.innerHTML = "CONTINUE";
                                continueButtons.onclick = () => {
                                    clickSound();
                                    args.onResponse("nothing", {});
                                    ShowStreet(false);
                                };
                                divB.appendChild(continueButtons);
                            } else {
                                requestAnimationFrame(func);
                            }
                        } else {
                            const b = document.querySelector("button#card-response-yes");

                            if (b) {
                                (b as HTMLButtonElement).onclick = () => {
                                    if (fartherInfo !== undefined)
                                        args.onResponse("special_action", {
                                            rolls: fartherInfo.rolls,
                                        });
                                    else args.onResponse("buy", {});
                                    ShowStreet(false);
                                };
                                (document.querySelector("button#card-response-no") as HTMLButtonElement).onclick = () => {
                                    clickSound();
                                    args.onResponse("nothing", {});
                                    ShowStreet(false);
                                };
                            } else {
                                requestAnimationFrame(func);
                            }
                        }
                    }
                    return func;
                }

                var belong_to_me = false;
                var belong_to_others = false;
                var count: 0 | 1 | 2 | 3 | 4 | "h" = 0;
                // check states
                for (const _prp of localPlayer.properties) {
                    if (!belong_to_me && _prp.posistion === args.location) {
                        belong_to_me = true;
                        count = _prp.count;
                    }
                }
                for (const _p of prop.players) {
                    for (const _prp of _p.properties) {
                        if (_prp.posistion === args.location && _p.id != localPlayer.id) belong_to_others = true;
                    }
                }

                if (x.group === "Special") {
                    args.onResponse("nothing", {});
                    ShowStreet(false);
                } else if (x.group === "Utilities") {
                    if (!belong_to_me) {
                        if (belong_to_others) {
                            args.onResponse("someones", {});
                            ShowStreet(false);
                            return;
                        } else {
                            if (localPlayer.balance - (x?.price ?? 0) < 0) {
                                ShowStreet(false);
                                args.onResponse("nothing", {});
                                return;
                            } else {
                                SetStreetType("Utilities");
                                const streetInfo = {
                                    cardCost: x.price ?? -1,
                                    title: x.name ?? "error",
                                    type: x.id.includes("water") ? "water" : "electricity",
                                } as UtilitiesDisplayInfo;
                                SetStreetDisplay(streetInfo);
                                SetAdvancedStreet(false);

                                swipeSound();
                                ShowStreet(true);
                                requestAnimationFrame(
                                    searchForButtons(false, args.location, {
                                        rolls: args.rolls,
                                    })
                                );
                            }
                        }
                    } else {
                        args.onResponse("nothing", {});
                    }
                } else if (x.group === "Railroad") {
                    if (!belong_to_me) {
                        if (belong_to_others) {
                            args.onResponse("someones", {});
                            ShowStreet(false);
                            return;
                        } else {
                            if (localPlayer.balance - (x?.price ?? 0) < 0) {
                                ShowStreet(false);
                                args.onResponse("nothing", {});
                                return;
                            } else {
                                SetStreetType("Railroad");
                                const streetInfo = {
                                    cardCost: x.price ?? -1,
                                    title: x.name ?? "error",
                                } as UtilitiesDisplayInfo;
                                SetStreetDisplay(streetInfo);
                                swipeSound();
                                ShowStreet(true);
                                requestAnimationFrame(searchForButtons(false, args.location));
                            }
                        }
                    } else {
                        args.onResponse("nothing", {});
                    }
                } else {
                    if (!belong_to_me && localPlayer.balance - (x?.price ?? 0) < 0) {
                        ShowStreet(false);
                        args.onResponse("nothing", {});
                        return;
                    }

                    if (belong_to_me) {
                    } else {
                        if (belong_to_others) {
                            args.onResponse("someones", {});
                            ShowStreet(false);
                            return;
                        }
                    }
                    if (belong_to_me && count === "h") {
                        ShowStreet(false);
                        args.onResponse("nothing", {});
                        return;
                    }
                    SetStreetType("Street");
                    const streetInfo = {
                        cardCost: x.price ?? -1,
                        hotelsCost: x.ohousecost ?? -1,
                        housesCost: x.housecost ?? -1,
                        rent: x.rent ?? -1,
                        multpliedrent: x.multpliedrent
                            ? [
                                  x.multpliedrent[0] ?? -1,
                                  x.multpliedrent[1] ?? -1,
                                  x.multpliedrent[2] ?? -1,
                                  x.multpliedrent[3] ?? -1,
                                  x.multpliedrent[4] ?? -1,
                              ]
                            : [-1, -1, -1, -1, -1],
                        rentWithColorSet: x.rent ? x.rent * 2 : -1,
                        title: x.name ?? "error",
                        group: x.group,
                    } as StreetDisplayInfo;
                    SetStreetDisplay(streetInfo);
                    belong_to_me ? SetAdvancedStreet(true) : SetAdvancedStreet(false);
                    swipeSound();
                    ShowStreet(true);
                    requestAnimationFrame(searchForButtons(belong_to_me, args.location));
                }
            } else {
                args.onResponse("nothing", {});
                ShowStreet(false);
            }
        },
        chorch(element, is_chance, time) {
            SetStreetType(is_chance ? "Chance" : "CommunityChest");
            SetStreetDisplay({
                title: element.title,
            } as ChanceDisplayInfo);
            swipeSound();
            ShowStreet(true);
            setTimeout(() => {
                ShowStreet(false);
            }, time);
        },
        applyAnimation(type) {
            applyAnimation(type);
        },
        showJailsButtons: (is_card: boolean) => {
            const payElement = document.querySelector(`button[data-button-type="pay"]`) as HTMLButtonElement;
            const cardElement = document.querySelector(`button[data-button-type="card"]`) as HTMLButtonElement;
            const rollElement = document.querySelector(`button[data-button-type="roll"]`) as HTMLButtonElement;

            function returnToNormal() {
                rollElement.onclick = () => {
                    SetSended(true);
                    prop.socket.emit("roll_dice");
                    console.warn("roll after return to normal");
                    SetTimer(0);
                };
                SetTimer(0);
                SetSended(true);
                cardElement.onclick = () => {};
                cardElement.setAttribute("aria-disabled", "true");
                setTimeout(() => {
                    cardElement.setAttribute("aria-disabled", "true");
                }, 300);

                payElement.style.translate = "0px 0px";
                payElement.onclick = () => {};
                payElement.setAttribute("aria-disabled", "true");
                setTimeout(() => {
                    payElement.setAttribute("aria-disabled", "true");
                }, 300);
            }

            payElement.setAttribute("aria-disabled", "false");
            payElement.onclick = () => {
                // handle paying
                applyAnimation(1);

                prop.socket.emit("unjail", "pay");
                prop.socket.emit("roll_dice");
                console.warn("pay");

                returnToNormal();
            };

            if (is_card) {
                const cardButton = cardElement as HTMLButtonElement;
                cardButton.setAttribute("aria-disabled", "false");
                cardButton.onclick = () => {
                    // take 1 card
                    prop.socket.emit("unjail", "card");
                    prop.socket.emit("roll_dice");
                    console.warn("card");
                    returnToNormal();
                };
            }
            rollElement.onclick = () => {
                prop.socket.emit("roll_dice");
                console.warn("roll when in jail");
                returnToNormal();
                SetSended(true);
                SetTimer(0);
            };
        },
    }));

    useEffect(() => {
        // Rotation and Scale with mouse
        (document.getElementById("locations") as HTMLDivElement).onwheel = (e) => {
            if (e.shiftKey) {
                SetScale((old) => old + (e.deltaY * (settings !== undefined ? settings.accessibility[1] : 5)) / 5000);
            } else {
                SetRotation((old) => old + (e.deltaY * (settings !== undefined ? settings.accessibility[0] : 45)) / 100);
            }
        };
        // Clicking Street
        const safe = Array.from(propretyMap.values()).filter((v) => v.group != "Special");
        for (const x of safe) {
            const element = (document.getElementById("locations") as HTMLDivElement).querySelector(
                `div.street[data-position="${x.posistion}"]`
            ) as HTMLDivElement;

            element.onclick = () => {
                prop.clickedOnBoard(x.posistion);
            };

            element.onmousemove = () => {
                element.style.cursor = "pointer";
                element.style.backgroundColor = "rgba(0,0,0,15%)";
            };
            element.onmouseleave = () => {
                element.style.cursor = "unset";
                element.style.scale = "1";
                element.style.backgroundColor = "rgba(0,0,0,0%)";
            };
        }
    }, [settings]);

    useEffect(() => {
        var continue_to_animate = true;
        var animate = () => {
            for (const x of prop.players.filter((v) => v.balance >= 0)) {
                const location = x.position;
                const icon = x.icon + 1;
                const injail = x.isInJail;

                const elementSearch = document.querySelector(`div.player[player-id="${x.id}"]`);
                if (elementSearch !== null) {
                    const _img = elementSearch.querySelector("div") as HTMLDivElement;
                    _img.style.rotate = `${-rotation}deg`;
                    _img.style.aspectRatio = "1";
                    if (settings !== undefined && settings.accessibility[4] === true) {
                        _img.setAttribute("data-tooltip-color", x.color);
                    } else if (_img.hasAttribute("data-tooltip-color")) {
                        (_img.querySelector("img") as HTMLImageElement).style.filter = ``;
                        _img.removeAttribute("data-tooltip-color");
                    }

                    // check if loaction is the same
                    const pos = elementSearch.parentElement?.getAttribute("data-position") as string;
                    if (parseInt(pos) !== x.position) {
                        elementSearch.parentElement?.removeChild(elementSearch);
                        document.querySelector(`div.street[data-position="${location}"]`)?.appendChild(elementSearch);
                    }
                    if (!injail && elementSearch.querySelector("img.jailIcon") != null) {
                        const div = elementSearch.querySelector("div") as HTMLDivElement;
                        const jailIcon = div.querySelector("img.jailIcon") as HTMLImageElement;
                        div.removeChild(jailIcon);
                    }

                    if (injail && elementSearch.querySelector("img.jailIcon") == null) {
                        while (elementSearch.firstChild) {
                            elementSearch.removeChild(elementSearch.firstChild);
                        }

                        const secondDiv = document.createElement("div");
                        secondDiv.setAttribute("data-tooltip-hover", x.username);
                        const image = document.createElement("img");
                        image.src = `./p${icon}.png`;
                        secondDiv.appendChild(image);

                        const jimage = document.createElement("img");
                        jimage.src = `./jail.png`;
                        jimage.className = "jailIcon";
                        secondDiv.appendChild(jimage);
                        elementSearch.appendChild(secondDiv);
                    }
                } else {
                    // Create
                    const element = document.createElement("div");
                    element.className = "player";
                    element.setAttribute("player-id", x.id);
                    element.setAttribute("player-position", x.position.toString());
                    const secondDiv = document.createElement("div");
                    secondDiv.setAttribute("data-tooltip-hover", x.username);
                    const image = document.createElement("img");
                    image.src = `./p${icon}.png`;
                    secondDiv.appendChild(image);
                    element.appendChild(secondDiv);
                    if (injail) {
                        const jimage = document.createElement("img");
                        jimage.src = `./jail.png`;
                        jimage.className = "jailIcon";
                        element.appendChild(jimage);
                    }

                    document.querySelector(`div.street[data-position="${location}"]`)?.appendChild(element);
                }
            }

            function propertiesDisplay() {
                const folder = document.getElementById("display-houses") as HTMLDivElement;
                // remove all older proprerties!
                const allStreets = Array.from(folder.querySelectorAll("div.street-houses"));
                for (const _st of allStreets) {
                    const st = _st as HTMLDivElement;
                    while (st.firstChild) {
                        st.removeChild(st.firstChild);
                    }
                    st.onclick = () => {};
                    st.style.cursor = "unset";
                    st.style.backgroundColor = "rgba(0,0,0,0%)";
                    st.style.padding = "0px";
                    st.innerHTML = "";
                    st.setAttribute("data-tooltip-hover", "");
                    st.style.zIndex = "unset";
                    st.style.boxShadow = "";
                }
                for (const _player of prop.players) {
                    for (const _prp of _player.properties) {
                        const location = _prp.posistion;
                        const state = _prp.count;

                        const queryElement = folder.querySelector(`div.street-houses[data-position="${location}"`);
                        if (queryElement != null) {
                            // add new propertie
                            const st = queryElement as HTMLDivElement;
                            st.setAttribute("data-tooltip-hover", _player.username);

                            st.onclick = () => {
                                const element = document.querySelector(`div.player[player-id="${_player.id}"]`) as HTMLDivElement;
                                element.style.animation = "spin2 1s cubic-bezier(.21, 1.57, .55, 1) infinite";
                                setTimeout(() => {
                                    element.style.animation = "";
                                }, 1 * 1000);
                            };

                            st.style.cursor = "pointer";

                            st.style.zIndex = "5";
                            switch (state) {
                                case 0:
                                    st.style.backgroundColor = "rgba(0,0,0,25%)";
                                    if (settings !== undefined && settings?.accessibility[4]) {
                                        st.style.backgroundColor = _player.color;
                                        st.style.boxShadow = "0px 0px 5px black";
                                    }
                                    var payment_ammount = 0;
                                    if (_prp.group === "Railroad") {
                                        const count = _player.properties
                                            .filter((v) => v.group === "Railroad")
                                            .filter((v) => v.morgage === undefined || (v.morgage !== undefined && v.morgage === false)).length;
                                        const rents = [0, 25, 50, 100, 200];
                                        var payment_ammount = rents[count];
                                    } else if (_prp.group === "Utilities" && _prp.rent) {
                                        const multy_ = _player.properties.filter((v) => v.group === "Utilities").length === 2 ? 10 : 4;
                                        payment_ammount = _prp.rent * multy_;
                                    }

                                    if (payment_ammount !== 0) {
                                        st.innerHTML = `<p>${payment_ammount}M</p>`;
                                        st.style.backgroundColor = "rgba(0,0,0,75%)";
                                        if (settings !== undefined && settings?.accessibility[4]) {
                                            st.style.backgroundColor = `${_player.color}`;
                                            st.style.boxShadow = "0px 0px 5px black";
                                        }
                                    }
                                    break;

                                case 1:
                                case 2:
                                case 3:
                                case 4:
                                    for (let index = 0; index < state; index++) {
                                        const image = document.createElement("img");
                                        image.src = HouseIcon.replace("public/", "");
                                        st.appendChild(image);
                                    }
                                    break;
                                case "h":
                                    const image = document.createElement("img");
                                    image.src = HotelIcon.replace("public/", "");
                                    st.appendChild(image);
                                    break;

                                default:
                                    break;
                            }
                        }
                    }
                }
            }
            propertiesDisplay();

            if (continue_to_animate) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);

        return () => {
            continue_to_animate = false;
        };
    }, [prop.players, rotation]);

    useEffect(() => {
        const rollElement = document.querySelector(`button[data-button-type="roll"]`) as HTMLButtonElement;
        rollElement.onclick = () => {
            SetSended(true);
            prop.socket.emit("roll_dice");
            console.warn("first roll");
            SetTimer(0);
        };
    }, []);

    useEffect(() => {
        if (prop.myTurn && !sended) {
            var l: NodeJS.Timeout | undefined = undefined;
            if (prop.selectedMode.turnTimer !== undefined && prop.selectedMode.turnTimer > 0) {
                var x = 0;
                l = setInterval(() => {
                    x += 1;
                    SetTimer(x);
                    if (prop.selectedMode.turnTimer !== undefined && prop.selectedMode.turnTimer > 0) {
                        if (x >= prop.selectedMode.turnTimer) {
                            if (prop.myTurn && !sended) {
                                const rollElement = document.querySelector(`button[data-button-type="roll"]`) as HTMLButtonElement;
                                rollElement.click();
                                SetTimer(0);
                                clearInterval(l);
                            }
                        }
                    }
                }, 1000);
            }
        }

        return () => {
            clearInterval(l);
            SetTimer(0);
            console.log("stopped");
        };
    }, [prop.myTurn, sended, prop.selectedMode]);

    useEffect(() => {
        // Add touch event passive listeners for better scrolling performance
        const options = { passive: true };
        const board = document.getElementById("locations") as HTMLDivElement;

        if (board) {
            board.addEventListener('touchstart', handleTouchStart as any, options);
            board.addEventListener('touchmove', handleTouchMove as any, options);
            
            return () => {
                board.removeEventListener('touchstart', handleTouchStart as any);
                board.removeEventListener('touchmove', handleTouchMove as any);
            };
        }
    }, []);

    return (
        <div className="game-container">
            <div 
                id="locations"
                className="board"
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, null)}
            >
                {/* Board content */}
                {props.elements.map((element, index) => (
                    <div
                        key={index}
                        className={`square ${element.type}`}
                        style={{
                            ...element.style,
                            touchAction: 'manipulation'
                        }}
                        onTouchEnd={(e) => handleTouchEnd(e, element)}
                    >
                        {element.content}
                    </div>
                ))}
            </div>
            
            <div className="controls-container">
                {/* Game controls */}
                <div className="game-info">
                    <div className="player-stats">
                        {/* Player information */}
                        {prop.myTurn && (
                            <div className="action-buttons">
                                <button 
                                    className="action-button"
                                    onClick={() => handleRoll()}
                                    disabled={!prop.myTurn || sended}
                                >
                                    Roll Dice
                                </button>
                                {/* Other action buttons */}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});
export default MonopolyGame;
