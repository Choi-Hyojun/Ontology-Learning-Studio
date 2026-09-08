# Neo Neon

[50_docu_step20.ttl](50_docu_step20.ttl)

# Neo-NeOn — Prompt Set

<aside>
▶️

**Document input / CQ 50 / No ontology metrics / No size target**

</aside>

# Global Variables

<aside>
⚙️

`ontology_metrics`는 사용하지 않는다. 아래 값들은 모든 Step에서 공통으로 참조하는 **global config**이고, `{previous_step_content}` 등은 별도의 runtime 변수로 취급한다.

</aside>

## Global variable map

```
{domain_name}
{domain_description}   # compatibility summary; full grounding still uses {document}
{document}
{keywords}
{reuse_example_desc}
{few_shot_reuse}
{few_shot_entity_extraction}
{few_shot_data_properties}
{few_shot_individuals}
{few_shot_cqs}
{persona}   # Step 00 output; Step 01–20 system context
```

- {domain_name}
    
    ```
    Video Game
    ```
    
- {domain_description} — compatibility summary
    
    ```
    A video game is an electronic game involving interaction through a user interface or input device to generate visual and commonly audiovisual feedback. The domain includes hardware and software platforms, gameplay genres and modes, input and output technologies, development and distribution, platform adaptations, industry history, ratings and regulation, and competitive play.
    ```
    
    **Rule:** compatibility/summary 용도다. 이 Run의 실제 grounding source는 항상 `{document}` 전체다.
    
- {document} — full original text
    
    ```markdown
    # Video Game
    
    A video game, computer game, or simply game is an electronic game that involves interaction with a user interface or input device (such as a joystick, controller, keyboard, or motion sensing device) to generate visual feedback from a display device, most commonly shown in a video format on a television set, computer monitor, flat-panel display or touchscreen on handheld devices, or a virtual reality headset. Most modern video games are audiovisual, with audio complement delivered through speakers or headphones, and sometimes also with other types of sensory feedback (e.g., haptic technology that provides tactile sensations). Some video games also allow microphone and webcam inputs for in-game chatting and livestreaming.
    
    Video games are typically categorized according to their hardware platform, which traditionally includes arcade video games, console games, and computer games (which includes LAN games, online games, and browser games). More recently, the video game industry has expanded onto mobile gaming through mobile devices (such as smartphones and tablet computers), virtual and augmented reality systems, and remote cloud gaming. Video games are also classified into a wide range of genres based on their style of gameplay and target audience.
    
    The first video game prototypes in the 1950s and 1960s were simple extensions of electronic games using video-like output from large, room-sized mainframe computers. The first consumer video game was the arcade video game Computer Space in 1971, which took inspiration from the earlier 1962 computer game Spacewar!. In 1972 came the now-iconic video game Pong and the first home console, the Magnavox Odyssey. The industry grew quickly during the "golden age" of arcade video games from the late 1970s to early 1980s, and companies like Atari, Mattel, and Coleco also released highly successful consoles for the home market: however, loss of publishing control and saturation of the console gaming market led to the crash of the North American video game market in 1983. Following the crash, the industry matured and diversified: by the late 1980s video game consoles became dominated by Japanese companies such as Nintendo, Sega, and later Sony, whereas the Microsoft Windows (and MS-DOS before it) line of operating systems increasingly came to dominate the computer gaming space, with multiplayer online PC games seeing the establishment of the nascent eSports scene. Arcades on the other hand steadily lost their technological edge and popularity by the end of the 1990s in the face of advancements in the console and computer space, especially in North America and Europe, while in the handheld space Nintendo achieved dominance with the Game Boy line. By the 2000s, Sega exited the console space, and from then on the landscape has been dominated by the "big three" console manufacturers of Nintendo, Sony, and Microsoft. At this time the core industry also increasingly centered on "AAA" games, leaving less room for riskier, experimental, and lower-budget games. Coupled with increasing availability of high-speed Internet and digital distribution, this gave room for independent video game development (or "indie games") to gain prominence into the 2010s. Since then, the commercial importance of the video game industry has been increasing. The emerging Asian markets and proliferation of smartphone games in particular are altering player demographics towards casual and cozy gaming, and increasing monetization by incorporating games as a service.
    
    Today, video game development requires numerous skills, vision, teamwork, and liaisons between different parties, including developers, publishers, distributors, retailers, hardware manufacturers, and other marketers, to successfully bring a game to its consumers. As of 2020, the global video game market had estimated annual revenues of US$159 billion across hardware, software, and services, which is three times the size of the global music industry and four times that of the film industry in 2019, making it a formidable heavyweight across the modern entertainment industry. The video game market is also a major influence behind the electronics industry, where personal computer component, console, and peripheral sales, as well as consumer demands for better game performance, have been powerful driving factors for hardware design and innovation.
    
    ## Terminology
    
    The term "video game" was developed to describe electronic games played on a video display rather than on a teletype printer, audio speaker, or similar device. This also distinguished from handheld electronic games such as Merlin, which commonly used LED lights for indicators not in combination for imaging purposes.
    
    "Computer game" may also be used as a descriptor, as all these types of games essentially require the use of a computer processor; in some cases, it is used interchangeably with "video game". Particularly in the United Kingdom and Western Europe, this is common due to the historic relevance of domestically produced microcomputers. Other terms used include digital game, for example, by the Australian Bureau of Statistics. The term "computer game" can also refer to PC games, which are played primarily on personal computers or other flexible hardware systems, to distinguish them from console games, arcade games, or mobile games.
    
    Other terms, such as "television game", "telegame", or "TV game", had been used in the 1970s and early 1980s, particularly for home gaming consoles that rely on connection to a television set. However, these terms were also used interchangeably with "video game" in the 1970s, primarily due to "video" and "television" being synonymous. In Japan, where consoles like the Odyssey were first imported and then made within the country by the large television manufacturers such as Toshiba and Sharp Corporation, such games are known as "TV games", "TV geemu", or "terebi geemu". The term "TV game" is still commonly used into the 21st century. "Electronic game" may also be used to refer to video games, but this also incorporates devices like early handheld electronic games that lack any video output.
    
    The first appearance of the term "video game" emerged around 1973. The Oxford English Dictionary cited a 10 November 1973 BusinessWeek article as the first printed use of the term. Though Bushnell believed the term came from a vending magazine review of Computer Space in 1971, a review of the major vending magazines Vending Times and Cashbox showed that the term may have come even earlier, appearing first in a letter dated July 10, 1972. In the letter, Bushnell uses the term "video game" twice. Per video game historian Keith Smith, the sudden appearance suggested that the term had been proposed and readily adopted by those in the field. Around March 1973, Ed Adlum, who ran Cashbox's coin-operated section until 1972 and then later founded RePlay Magazine, covering the coin-op amusement field, in 1975, used the term in an article in March 1973. In a September 1982 issue of RePlay, Adlum is credited with first naming these games as "video games": "RePlay's Eddie Adlum worked at 'Cash Box' when 'TV games' first came out. The personalities in those days were Bushnell, his sales manager Pat Karns, and a handful of other 'TV game' manufacturers like Henry Leyser and the McEwan brothers. It seemed awkward to call their products 'TV games', so borrowing a word from Billboard's description of movie jukeboxes, Adlum started to refer to this new breed of amusement machine as 'video games.' The phrase stuck." Adlum explained in 1985 that up until the early 1970s, amusement arcades typically had non-video arcade games such as pinball machines and electro-mechanical games. With the arrival of video games in arcades during the early 1970s, there was initially some confusion in the arcade industry over what term should be used to describe the new games. He "wrestled with descriptions of this type of game," alternating between "TV game" and "television game" but "finally woke up one day" and said, "What the hell... video game!"
    
    ### Definition
    
    While many games readily fall into a clear, well-understood definition of video games, new genres and innovations in game development have raised the question of what are the essential factors of a video game that separate the medium from other forms of entertainment.
    
    The introduction of interactive films in the 1980s with games like Dragon's Lair, featured games with full motion video played off a form of media but only limited user interaction. This had required a means to distinguish these games from more traditional board games that happen to also use external media, such as the Clue VCR Mystery Game which required players to watch VCR clips between turns. To distinguish between these two, video games are considered to require some interactivity that affects the visual display.
    
    Most video games tend to feature some type of victory or winning conditions, such as a scoring mechanism or a final boss fight. The introduction of walking simulators (adventure games that allow for exploration but lack any objectives) like Gone Home, and empathy games (video games that tend to focus on emotion) like That Dragon, Cancer brought the idea of games that did not have any such type of winning condition and raising the question of whether these were actually games. These are still commonly justified as video games as they provide a game world that the player can interact with by some means.
    
    The lack of any industry definition for a video game by 2021 was an issue during the case Epic Games v. Apple which dealt with video games offered on Apple's iOS App Store. Among concerns raised were games like Fortnite Creative and Roblox which created metaverses of interactive experiences, and whether the larger game and the individual experiences themselves were games or not in relation to fees that Apple charged for the App Store. Judge Yvonne Gonzalez Rogers, recognizing that there was yet an industry standard definition for a video game, established for her ruling that "At a bare minimum, video games appear to require some level of interactivity or involvement between the player and the medium" compared to passive entertainment like film, music, and television, and "videogames are also generally graphically rendered or animated, as opposed to being recorded live or via motion capture as in films or television". Rogers still concluded that what is a video game "appears highly eclectic and diverse".
    
    ### Video game terminology
    
    The gameplay experience varies radically between video games, but many common elements exist. Most games will launch into a title screen and give the player a chance to review options such as the number of players before starting a game. Most games are divided into levels which the player must work the avatar through, scoring points, collecting power-ups to boost the avatar's innate attributes, all while either using special attacks to defeat enemies or moves to avoid them. This information is relayed to the player through a type of on-screen user interface such as a heads-up display atop the rendering of the game itself. Taking damage will deplete their avatar's health, and if that falls to zero or if the avatar otherwise falls into an impossible-to-escape location, the player will lose one of their lives. Should they lose all their lives without gaining an extra life or "1-UP", then the player will reach the "game over" screen. Many levels as well as the game's finale end with a type of boss character the player must defeat to continue on. In some games, intermediate points between levels will offer save points where the player can create a saved game on storage media to restart the game should they lose all their lives or need to stop the game and restart at a later time. These also may be in the form of a passage that can be written down and reentered at the title screen.
    
    Product flaws include software bugs which can manifest as glitches which may be exploited by the player; this is often the foundation of speedrunning a video game. These bugs, along with cheat codes, Easter eggs, and other hidden secrets that were intentionally added to the game can also be exploited. On some consoles, cheat cartridges allow players to execute these cheat codes, and user-developed trainers allow similar bypassing for computer software games. Both of which might make the game easier, give the player additional power-ups, or change the appearance of the game.
    
    ## Components
    
    To distinguish from electronic games, a video game is generally considered to require a platform, the hardware which contains computing elements, to process player interaction from some type of input device and displays the results to a video output display.
    
    ### Platform
    
    Video games require a platform, a specific combination of electronic components or computer hardware and associated software, to operate. The term system is also commonly used. These platforms may include multiple brandsheld by platform holders, such as Nintendo or Sony, seeking to gain larger market shares. Games are typically designed to be played on one or a limited number of platforms, and exclusivity to a platform or brand is used by platform holders as a competitive edge in the video game market. However, games may be developed for alternative platforms than intended, which are described as ports or conversions. These also may be remasters - where most of the original game's source code is reused and art assets, models, and game levels are updated for modern systems – and remakes, where in addition to asset improvements, significant reworking of the original game and possibly from scratch is performed.
    
    The list below is not exhaustive and excludes other electronic devices capable of playing video games such as PDAs and graphing calculators.
    
    #### PC games
    
    PC games involve a player interacting with a personal computer (PC) connected to a video monitor. Personal computers are not dedicated game platforms, so there may be differences running the same game on different hardware. Also, the openness allows some features to developers like reduced software cost, increased flexibility, increased innovation, emulation, creation of modifications or mods, open hosting for online gaming (in which a person plays a video game with people who are in a different household) and others. A gaming computer is a PC or laptop intended specifically for gaming, typically using high-performance, high-cost components. In addition to personal computer gaming, there also exist games that work on mainframe computers and other similarly shared systems, with users logging in remotely to use the computer.
    
    #### Home console
    
    A console game is played on a home console, a specialized electronic device that connects to a common television set or composite video monitor. Home consoles are specifically designed to play games using a dedicated hardware environment, giving developers a concrete hardware target for development and assurances of what features will be available, simplifying development compared to PC game development. Usually consoles only run games developed for it, or games from other platform made by the same company, but never games developed by its direct competitor, even if the same game is available on different platforms. It often comes with a specific game controller. Major console platforms include Xbox, PlayStation and Nintendo.
    
    #### Handheld console
    
    A handheld game console is a small, self-contained electronic device that is portable and can be held in a user's hands. It features the console, a small screen, speakers and buttons, joystick or other game controllers in a single unit. Like consoles, handhelds are dedicated platforms, and share almost the same characteristics. Handheld hardware usually is less powerful than PC or console hardware. Some handheld games from the late 1970s and early 1980s could only play one game. In the 1990s and 2000s, a number of handheld games used cartridges, which enabled them to be used to play many different games. The handheld console has waned in the 2010s as mobile device gaming has become a more dominant factor.
    
    #### Arcade video game
    
    An arcade video game generally refers to a game played on an even more specialized type of electronic device that is typically designed to play only one game and is encased in a special, large coin-operated cabinet which has one built-in console, controllers (joystick, buttons, etc.), a CRT screen, and audio amplifier and speakers. Arcade games often have brightly painted logos and images relating to the theme of the game. While most arcade games are housed in a vertical cabinet, which the user typically stands in front of to play, some arcade games use a tabletop approach, in which the display screen is housed in a table-style cabinet with a see-through table top. With table-top games, the users typically sit to play. In the 1990s and 2000s, some arcade games offered players a choice of multiple games. In the 1980s, video arcades were businesses in which game players could use a number of arcade video games. In the 2010s, there are far fewer video arcades, but some movie theaters and family entertainment centers still have them.
    
    #### Browser game
    
    A browser game takes advantages of standardizations of technologies for the functionality of web browsers across multiple devices providing a cross-platform environment. These games may be identified based on the website that they appear, such as with Miniclip games. Others are named based on the programming platform used to develop them, such as Java and Flash games.
    
    #### Mobile game
    
    With the introduction of smartphones and tablet computers standardized on the iOS and Android operating systems, mobile gaming has become a significant platform. These games may use unique features of mobile devices that are not necessary present on other platforms, such as accelerometers, global positioning information and camera devices to support augmented reality gameplay.
    
    #### Cloud gaming
    
    Cloud gaming requires a minimal hardware device, such as a basic computer, console, laptop, mobile phone or even a dedicated hardware device connected to a display with good Internet connectivity that connects to hardware systems by the cloud gaming provider. The game is computed and rendered on the remote hardware, using a number of predictive methods to reduce the network latency between player input and output on their display device. For example, the Xbox Cloud Gaming and PlayStation Now platforms use dedicated custom server blade hardware in cloud computing centers.
    
    #### Virtual reality
    
    Virtual reality (VR) games generally require players to use a special head-mounted unit that provides stereoscopic screens and motion tracking to immerse a player within virtual environment that responds to their head movements. Some VR systems include control units for the player's hands as to provide a direct way to interact with the virtual world. VR systems generally require a separate computer, console, or other processing device that couples with the head-mounted unit.
    
    #### Emulation
    
    An emulator enables games from a console or otherwise different system to be run in a type of virtual machine on a modern system, simulating the hardware of the original and allows old games to be played. While emulators themselves have been found to be legal in United States case law, the act of obtaining the game software that one does not already own may violate copyrights. However, there are some official releases of emulated software from game manufacturers, such as Nintendo with its Virtual Console or Nintendo Switch Online offerings.
    
    #### Backward compatibility
    
    Backward compatibility is similar in nature to emulation in that older games can be played on newer platforms, but typically directly though hardware and built-in software within the platform. The PlayStation 2 popularized the trend by having the capability of playing past generation games from the PlayStation via inserting the original game media into the newer console, while Nintendo's Wii could play GameCube titles as well in the same manner.
    
    ### Game media
    
    Early arcade games, home consoles, and handheld games were dedicated hardware units with the game's logic built into the electronic componentry of the hardware. Since then, most video game platforms are considered programmable, having means to read and play multiple games distributed on different types of media or formats. Physical formats include ROM cartridges, magnetic storage including magnetic-tape data storage and floppy discs, optical media formats including CD-ROM and DVDs, and flash memory cards. Furthermore digital distribution over the Internet or other communication methods as well as cloud gaming alleviate the need for any physical media. In some cases, the media serves as the direct read-only memory for the game, or it may be the form of installation media that is used to write the main assets to the player's platform's local storage for faster loading periods and later updates.
    
    Games can be extended with new content and software patches through either expansion packs which are typically available as physical media, or as downloadable content nominally available via digital distribution. These can be offered freely or can be used to monetize a game following its initial release. Several games offer players the ability to create user-generated content to share with others to play. Other games, mostly those on personal computers, can be extended with user-created modifications or mods that alter or add onto the game; these often are unofficial and were developed by players from reverse engineering of the game, but other games provide official support for modding the game.
    
    ### Input device
    
    Video games may use several types of input devices to translate human actions to a game. Most common is the use of game controllers like gamepads and joysticks for most consoles, and as accessories for personal computer systems along keyboard and mouse controls. Common controls on the most recent controllers include face buttons, shoulder triggers, analog sticks, and directional pads ("d-pads"). Consoles typically include standard controllers which are shipped or bundled with the console itself, while peripheral controllers are available as a separate purchase from the console manufacturer or third-party vendors. Similar control sets are built into handheld consoles and onto arcade cabinets. Newer technology improvements have incorporated additional technology into the controller or the game platform, such as touchscreens and motion detection sensors that give more options for how the player interacts with the game. Specialized controllers may be used for certain genres of games, including racing wheels, light guns and dance pads. Digital cameras,s microphones and motion detectors can capture sound and movement from the player as input into the game, which can, in some cases, effectively eliminate the control, and on other systems such as virtual reality, are used to enhance immersion into the game.
    
    ### Display and output
    
    By definition, all video games are intended to output graphics to an external video display, such as cathode ray tube televisions, newer liquid-crystal display (LCD) televisions and built-in screens, projectors or computer monitors, depending on the type of platform the game is played on. Features such as color depth, refresh rate, frame rate, and screen resolution are a combination of the limitations of the game platform and display device and the program efficiency of the game itself. The game's output can range from fixed displays using LED or LCD elements, text-based games, two-dimensional and three-dimensional graphics, and augmented reality displays.
    
    The game's graphics are often accompanied by sound produced by internal speakers on the game platform or external speakers attached to the platform, as directed by the game's programming. This often will include sound effects tied to the player's actions to provide audio feedback, as well as background music for the game.
    
    Some platforms support additional feedback mechanics to the player that a game can take advantage of. This is most commonly haptic technology built into the game controller, such as causing the controller to shake in the player's hands to simulate a shaking earthquake occurring in game.
    
    ## Classifications
    
    Video games are frequently classified by a number of factors related to how one plays them.
    
    ### Genre
    
    A video game, like most other forms of media, may be categorized into genres. However, unlike film or television which use visual or narrative elements, video games are generally categorized into genres based on their gameplay interaction, since this is the primary means which one interacts with a video game. The narrative setting does not impact gameplay; a shooter game is still a shooter game, regardless of whether it takes place in a fantasy world or in outer space. An exception is the horror game genre, used for games that are based on narrative elements of horror fiction, the supernatural, and psychological horror.
    
    Genre names are normally self-describing in terms of the type of gameplay, such as action game, role playing game, or shoot 'em up, though some genres have derivations from influential works that have defined that genre, such as roguelikes from Rogue, Grand Theft Auto clones from Grand Theft Auto III, and battle royale games from the film Battle Royale. The names may shift over time as players, developers and the media come up with new terms; for example, first-person shooters were originally called "Doom clones" based on the 1993 game. A hierarchy of game genres exist, with top-level genres like "shooter game" and "action game" that broadly capture the game's main gameplay style, and several subgenres of specific implementation, such as within the shooter game first-person shooter and third-person shooter. Some cross-genre types also exist that fall until multiple top-level genres such as action-adventure game.
    
    ### Mode
    
    A video game's mode describes how many players can use the game at the same type. This is primarily distinguished by single-player video games and multiplayer video games. Within the latter category, multiplayer games can be played in a variety of ways, including locally at the same device, on separate devices connected through a local network such as LAN parties, or online via separate Internet connections. Most multiplayer games are based on competitive gameplay, but many offer cooperative and team-based options as well as asymmetric gameplay. Online games use server structures that can also enable massively multiplayer online games (MMOs) to support hundreds of players at the same time.
    
    A small number of video games are zero-player games, in which the player has very limited interaction with the game itself. These are most commonly simulation games where the player may establish a starting state and then let the game proceed on its own, watching the results as a passive observer, such as with many computerized simulations of Conway's Game of Life.
    
    ### Types
    
    Most video games are intended for entertainment purposes. Different game types include:
    
    #### Core games
    
    Core or hard-core games refer to the typical perception of video games, developed for entertainment purposes. These games typically require a fair amount of time to learn and master, in contrast to casual games, and thus are most appealing to gamers rather than a broader audience. Most of the AAA video game industry is based around the delivery of core games.
    
    #### Casual games
    
    In contrast to core games, casual games are designed for ease of accessibility, simple to understand gameplay and quick to grasp rule sets, and aimed at mass market audience. They frequently support the ability to jump in and out of play on demand, such as during commuting or lunch breaks. Numerous browser and mobile games fall into the casual game area, and casual games often are from genres with low intensity game elements such as match three, hidden object, time management, and puzzle games. Causal games frequently use social-network game mechanics, where players can enlist the help of friends on their social media networks for extra turns or moves each day. Popular casual games include Tetris and Candy Crush Saga. More recent, starting in the late 2010s, are hyper-casual games which use even more simplistic rules for short but infinitely replayable games, such as Flappy Bird.
    
    #### Educational games
    
    Education software has been used in homes and classrooms to help teach children and students, and video games have been similarly adapted for these reasons, all designed to provide a form of interactivity and entertainment tied to game design elements. There are a variety of differences in their designs and how they educate the user. These are broadly split between edutainment games that tend to focus on the entertainment value and rote learning but are unlikely to engage in critical thinking, and educational video games that are geared towards problem solving through motivation and positive reinforcement while downplaying the entertainment value. Examples of educational games include The Oregon Trail and the Carmen Sandiego series. Further, games not initially developed for educational purposes have found their way into the classroom after release, such as that feature open worlds or virtual sandboxes like Minecraft, or offer critical thinking skills through puzzle video games like SpaceChem.
    
    #### Serious games
    
    Further extending from educational games, serious games are those where the entertainment factor may be augmented, overshadowed, or even eliminated by other purposes for the game. Game design is used to reinforce the non-entertainment purpose of the game, such as using video game technology for the game's interactive world, or gamification for reinforcement training. Educational games are a form of serious games, but other types of games include fitness games that incorporate significant physical exercise to help keep the player fit (such as Wii Fit), simulator games that resemble flight simulators to pilot aircraft (such as Microsoft Flight Simulator), advergames that are built around the advertising of a product (such as Pepsiman), and newsgames aimed at conveying a specific advocacy message (such as NarcoGuerra).
    
    #### Art games
    
    Although video games have been considered an art form on their own, games may be developed to try to purposely communicate a story or message, using the medium as a work of art. These art or arthouse games are designed to generate emotion and empathy from the player by challenging societal norms and offering critique through the interactivity of the video game medium. They may not have any type of win condition and are designed to let the player explore through the game world and scenarios. Most art games are indie games in nature, designed based on personal experiences or stories through a single developer or small team. Examples of art games include Passage, Flower, and That Dragon, Cancer.
    
    ### Content rating
    
    Video games can be subject to national and international content rating requirements. Like with film content ratings, video game ratings typing identify the target age group that the national or regional ratings board believes is appropriate for the player, ranging from all-ages, to a teenager-or-older, to mature, to the infrequent adult-only games. Most content review is based on the level of violence, both in the type of violence and how graphic it may be represented, and sexual content, but other themes such as drug and alcohol use and gambling that can influence children may also be identified. A primary identifier based on a minimum age is used by nearly all systems, along with additional descriptors to identify specific content that players and parents should be aware of.
    
    The regulations vary from country to country but generally are voluntary systems upheld by vendor practices, with penalty and fines issued by the ratings body on the video game publisher for misuse of the ratings. Among the major content rating systems include:
    
    - Entertainment Software Rating Board (ESRB) that oversees games released in the United States. ESRB ratings are voluntary and rated along a E (Everyone), E10+ (Everyone 10 and older), T (Teen), M (Mature), and AO (Adults Only). Attempts to mandate video games ratings in the U.S. subsequently led to the landmark Supreme Court case, Brown v. Entertainment Merchants Association in 2011 which ruled video games were a protected form of art, a key victory for the video game industry.
    
    - Pan European Game Information (PEGI) covering the United Kingdom, most of the European Union and other European countries, replacing previous national-based systems. The PEGI system uses content rated based on minimum recommended ages, which include 3+, 8+, 12+, 16+, and 18+.
    
    - Australian Classification Board (ACB) oversees the ratings of games and other works in Australia, using ratings of G (General), PG (Parental Guidance), M (Mature), MA15+ (Mature Accompanied), R18+ (Restricted), and X (Restricted for pornographic material). ACB can also deny to give a rating to game (RC – Refused Classification). The ACB's ratings are enforceable by law, and importantly, games cannot be imported or purchased digitally in Australia if they have failed to gain a rating or were given the RC rating, leading to a number of notable banned games.
    
    - Computer Entertainment Rating Organization (CERO) rates games for Japan. Their ratings include A (all ages), B (12 and older), C (15 and over), D (17 and over), and Z (18 and over).
    
    - Unterhaltungssoftware Selbstkontrolle (USK) rates games for Germany. Their ratings include 0, 6, 12, 16, and 18.
    
    Additionally, the major content system provides have worked to create the International Age Rating Coalition (IARC), a means to streamline and align the content ratings system between different region, so that a publisher would only need to complete the content ratings review for one provider, and use the IARC transition to affirm the content rating for all other regions.
    
    Certain nations have even more restrictive rules related to political or ideological content. Within Germany, until 2018, the Unterhaltungssoftware Selbstkontrolle (Entertainment Software Self-Regulation) would refuse to classify, and thus allow sale, of any game depicting Nazi imagery, and thus often requiring developers to replace such imagery with fictional ones. This ruling was relaxed in 2018 to allow for such imagery for "social adequacy" purposes that applied to other works of art. China's video game segment is mostly isolated from the rest of the world due to the government's censorship, and all games published there must adhere to strict government review, disallowing content such as smearing the image of the Chinese Communist Party. Foreign games published in China often require modification by developers and publishers to meet these requirements.
    ```
    
    **Rule:** 이 원문 전체가 `{document}` 값이다. 요약본이나 `domain_description`으로 대체하지 않는다.
    
- {keywords} — re-extracted from documen
    
    <aside>
    🔑
    
    기존의 짧은 keyword list를 폐기하고 full document의 핵심 개념을 다시 추출했다. 고유명사는 역사적 grounding에 의미가 있는 경우만 포함했다.
    
    </aside>
    
    ```
    Video game; Computer game; Platform; Gameplay; Genre; Game mode; Input device; Output and sensory feedback; Developer and publisher; Port, remaster, and remake; Physical media and digital distribution; Downloadable content and modding; Online and cloud gaming; Game engine; Rating and regulation; Esports; Games as a service and monetization; Terminology and historical evolution
    ```
    
- {reuse_example_desc}
    
    ```
    Small human-provided reference slices for the Video Game domain. These examples represent structures that a domain user could reasonably identify as good examples without needing to author a complete OWL ontology. Use them as modeling hints for reuse; the ontology-engineering persona is responsible for determining appropriate formalization, vocabulary reuse, and alignment.
    ```
    
- {few_shot_reuse} — active compact reference examples
    
    ```
    Example 1 — Game and release
    GameRelease — releaseOf — VideoGame
    GameRelease — availableOnPlatform — Platform
    GameRelease — publishedBy — Organization
    
    Example 2 — Organizations
    Developer — SubClassOf — Organization
    Publisher — SubClassOf — Organization
    VideoGame — developedBy — Developer
    
    Example 3 — Genre
    FirstPersonShooter — SubClassOf — Shooter
    ActionAdventure — SubClassOf — ActionGame
    VideoGame — hasGenre — Genre
    
    Example 4 — Input and output
    VideoGame — supportsInputDevice — InputDevice
    Controller — SubClassOf — InputDevice
    VideoGame — providesFeedbackThrough — OutputDevice
    
    Example 5 — Adaptation
    Port — SubClassOf — GameRelease
    Remaster — SubClassOf — GameRelease
    Remake — SubClassOf — GameRelease
    Remaster — derivedFrom — GameRelease
    
    Example 6 — Provenance and metadata
    Rating — hasSource — Source
    Review — hasSource — Source
    GameRelease — releaseDate — Date
    ```
    
    **Interpretation:** These are small human-provided reference slices, not complete ontology modules and not mandatory mappings. The LLM may use ontology-engineering knowledge to formalize or align them when appropriate.
    
- Archived draft — expert-authored full reference fragments
    
    ```jsx
    # Human-curated reference ontology fragments
    # These fragments are intended to resemble small gold/reference ontology modules.
    # Reuse or adapt them when their semantics fit the accepted specification and document.
    
    @prefix : <https://example.org/video-game/> .
    @prefix owl: <http://www.w3.org/2002/07/owl#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix dcterms: <http://purl.org/dc/terms/> .
    @prefix skos: <http://www.w3.org/2004/02/skos/core#> .
    @prefix prov: <http://www.w3.org/ns/prov#> .
    @prefix schema: <https://schema.org/> .
    
    # Reference Fragment 1 — VideoGame / GameRelease / Platform
    :VideoGame a owl:Class ;
        rdfs:subClassOf schema:VideoGame .
    
    :GameRelease a owl:Class .
    :Platform a owl:Class .
    
    :releaseOf a owl:ObjectProperty ;
        rdfs:domain :GameRelease ;
        rdfs:range :VideoGame .
    
    :hasRelease a owl:ObjectProperty ;
        owl:inverseOf :releaseOf ;
        rdfs:domain :VideoGame ;
        rdfs:range :GameRelease .
    
    :availableOnPlatform a owl:ObjectProperty ;
        rdfs:domain :GameRelease ;
        rdfs:range :Platform .
    
    :GameRelease rdfs:subClassOf
        [ a owl:Restriction ;
          owl:onProperty :releaseOf ;
          owl:qualifiedCardinality "1"^^xsd:nonNegativeInteger ;
          owl:onClass :VideoGame
        ] ,
        [ a owl:Restriction ;
          owl:onProperty :availableOnPlatform ;
          owl:minQualifiedCardinality "1"^^xsd:nonNegativeInteger ;
          owl:onClass :Platform
        ] .
    
    # Reference Fragment 2 — Organization / Developer / Publisher roles
    :Organization a owl:Class ;
        rdfs:subClassOf prov:Organization .
    
    :Developer a owl:Class ;
        rdfs:subClassOf :Organization .
    
    :Publisher a owl:Class ;
        rdfs:subClassOf :Organization .
    
    :Distributor a owl:Class ;
        rdfs:subClassOf :Organization .
    
    :developedBy a owl:ObjectProperty ;
        rdfs:domain :VideoGame ;
        rdfs:range :Organization .
    
    :publishedBy a owl:ObjectProperty ;
        rdfs:domain :GameRelease ;
        rdfs:range :Organization .
    
    :distributedBy a owl:ObjectProperty ;
        rdfs:domain :GameRelease ;
        rdfs:range :Organization .
    
    :DeveloperRole a prov:Role .
    :PublisherRole a prov:Role .
    :DistributorRole a prov:Role .
    
    # Reference Fragment 3 — Genre as a controlled, polyhierarchical vocabulary
    :VideoGameGenreScheme a skos:ConceptScheme .
    
    :Shooter a skos:Concept ;
        skos:inScheme :VideoGameGenreScheme ;
        skos:prefLabel "Shooter"@en .
    
    :Action a skos:Concept ;
        skos:inScheme :VideoGameGenreScheme ;
        skos:prefLabel "Action"@en .
    
    :Adventure a skos:Concept ;
        skos:inScheme :VideoGameGenreScheme ;
        skos:prefLabel "Adventure"@en .
    
    :FirstPersonShooter a skos:Concept ;
        skos:inScheme :VideoGameGenreScheme ;
        skos:prefLabel "First-person shooter"@en ;
        skos:broader :Shooter .
    
    :ActionAdventure a skos:Concept ;
        skos:inScheme :VideoGameGenreScheme ;
        skos:prefLabel "Action-adventure"@en ;
        skos:broader :Action, :Adventure .
    
    :hasGenre a owl:ObjectProperty ;
        rdfs:domain :VideoGame ;
        rdfs:range skos:Concept .
    
    # Reference Fragment 4 — Input / output / feedback and actual gameplay use
    :GameplaySession a owl:Class .
    :InputDevice a owl:Class .
    :OutputDevice a owl:Class .
    :FeedbackModality a owl:Class .
    
    :Controller a owl:Class ; rdfs:subClassOf :InputDevice .
    :Keyboard a owl:Class ; rdfs:subClassOf :InputDevice .
    :Touchscreen a owl:Class ; rdfs:subClassOf :InputDevice .
    :DisplayDevice a owl:Class ; rdfs:subClassOf :OutputDevice .
    :AudioOutputDevice a owl:Class ; rdfs:subClassOf :OutputDevice .
    :HapticDevice a owl:Class ; rdfs:subClassOf :OutputDevice .
    :VisualFeedback a owl:Class ; rdfs:subClassOf :FeedbackModality .
    :AudioFeedback a owl:Class ; rdfs:subClassOf :FeedbackModality .
    :HapticFeedback a owl:Class ; rdfs:subClassOf :FeedbackModality .
    
    :supportsInputDevice a owl:ObjectProperty ;
        rdfs:domain :GameRelease ;
        rdfs:range :InputDevice .
    
    :supportsOutputDevice a owl:ObjectProperty ;
        rdfs:domain :GameRelease ;
        rdfs:range :OutputDevice .
    
    :providesFeedback a owl:ObjectProperty ;
        rdfs:domain :GameRelease ;
        rdfs:range :FeedbackModality .
    
    :usedInputDevice a owl:ObjectProperty ;
        rdfs:domain :GameplaySession ;
        rdfs:range :InputDevice .
    
    :usedOutputDevice a owl:ObjectProperty ;
        rdfs:domain :GameplaySession ;
        rdfs:range :OutputDevice .
    
    # Reference Fragment 5 — Rating assignment with provenance
    :RatingAssignment a owl:Class ;
        rdfs:subClassOf prov:Entity .
    
    :RatingSystem a owl:Class .
    :RatingCode a owl:Class .
    
    :RatingOrganization a owl:Class ;
        rdfs:subClassOf prov:Organization .
    
    :ratingOf a owl:ObjectProperty ;
        rdfs:domain :RatingAssignment ;
        rdfs:range :GameRelease .
    
    :usesRatingSystem a owl:ObjectProperty ;
        rdfs:domain :RatingAssignment ;
        rdfs:range :RatingSystem .
    
    :hasRatingCode a owl:ObjectProperty ;
        rdfs:domain :RatingAssignment ;
        rdfs:range :RatingCode .
    
    :assignedBy a owl:ObjectProperty ;
        rdfs:domain :RatingAssignment ;
        rdfs:range :RatingOrganization .
    
    :hasProvenanceSource a owl:ObjectProperty ;
        rdfs:subPropertyOf prov:wasDerivedFrom ;
        rdfs:domain :RatingAssignment ;
        rdfs:range prov:Entity .
    
    # Reference Fragment 6 — Port / remaster / remake derivation
    :Port a owl:Class ;
        rdfs:subClassOf :GameRelease .
    
    :Remaster a owl:Class ;
        rdfs:subClassOf :GameRelease .
    
    :Remake a owl:Class ;
        rdfs:subClassOf :GameRelease .
    
    :derivedFromRelease a owl:ObjectProperty ;
        rdfs:subPropertyOf prov:wasDerivedFrom ;
        rdfs:domain :GameRelease ;
        rdfs:range :GameRelease .
    
    :portOf a owl:ObjectProperty ;
        rdfs:subPropertyOf :derivedFromRelease ;
        rdfs:domain :Port ;
        rdfs:range :GameRelease .
    
    :remasterOf a owl:ObjectProperty ;
        rdfs:subPropertyOf :derivedFromRelease ;
        rdfs:domain :Remaster ;
        rdfs:range :GameRelease .
    
    :remakeOf a owl:ObjectProperty ;
        rdfs:subPropertyOf :derivedFromRelease ;
        rdfs:domain :Remake ;
        rdfs:range :GameRelease .
    
    General reuse rules:
    - Treat these as worked patterns, not mandatory mappings.
    - Prefer direct reuse when an external term already expresses the required meaning precisely.
    - Use rdfs:subClassOf or rdfs:subPropertyOf only when the local semantics are genuinely narrower.
    - Use owl:equivalentClass / owl:equivalentProperty only when definitions and entailments truly match in both directions.
    - Use owl:sameAs only for true identity between individuals.
    - Do not introduce a local wrapper property merely to rename an external property.
    - Do not import an entire external ontology solely because one or two terms are reused; import only when its axioms are intentionally required for reasoning.
    - Reuse decisions must improve at least one of interoperability, semantic precision, CQ answerability, or provenance, and must not distort the local domain model.
    ```
    
- {few_shot_cqs} — new examples
    
    ```
    EX-CQ01. On which platform or platforms can a particular video game release be played?
    
    EX-CQ02. Which video games support a particular type of input device?
    
    EX-CQ03. Which genre and subgenre classifications apply to a particular video game?
    
    EX-CQ04. Which organizations developed or published a particular video game or release?
    
    EX-CQ05. How is a particular port, remaster, or remake related to an earlier version or game?
    
    EX-CQ06. What source supports a particular rating, review, or historical assertion about a video game?
    ```
    
    **Use:** style/coverage examples only. Step 03 must generate a fresh set of exactly 50 CQs from the document and requirements; it must not simply copy these examples.
    
- {few_shot_entity_extraction} — new examples
    
    ```
    Example 1 — Relation extraction without overcommitting the schema
    Q: On which platform or platforms can a particular video game release be played?
    Candidate entities: VideoGame or GameRelease, Platform
    Candidate relation: availableOnPlatform
    Modeling note: decide whether the relation belongs on the abstract game or on a release only after the specification has established that distinction. Do not force both.
    
    Example 2 — Taxonomy extraction
    Q: Which input devices can be used to interact with a particular game?
    Candidate entities: InputDevice and document-supported specializations such as Controller, Keyboard, Touchscreen, MotionSensor, Microphone, Webcam
    Candidate relation: supportsInputDevice
    Safe axiom pattern: a specialized device may be modeled as rdfs:subClassOf InputDevice when the document clearly supports an is-a relation.
    
    Example 3 — Datatype instead of unnecessary class
    Q: When was a particular game or release made available?
    Candidate entity: the game/release entity already present in the model
    Candidate data property: releaseDate
    Candidate datatype: xsd:date or xsd:gYear depending on the precision supported by the source
    Modeling note: do not introduce a Year class when a datatype value is sufficient.
    
    Example 4 — Context-sensitive agent relation
    Q: Which organization developed or published a particular game?
    Candidate entity: Organization plus the game/release entity
    Candidate relations: developedBy, publishedBy
    Modeling note: do not automatically make Developer and Publisher disjoint organization subclasses; they may be roles played by the same organization in different contexts.
    
    Example 5 — Version or derivation relation
    Q: How is a particular port, remaster, or remake related to an earlier game or release?
    Candidate entities: the relevant game/release entities and, only if justified by the specification, a release or adaptation category
    Candidate relation: derivedFrom, adapts, portOf, remasterOf, remakeOf, or another semantically appropriate relation
    Modeling note: do not create all possible adaptation classes and properties merely because the terms appear in the document; extract only the distinctions required by the CQ set and specification.
    
    Example 6 — Provenance and possible reification
    Q: What source supports a particular rating, review, or historical assertion?
    Candidate entities: the asserted resource or statement, Source, and possibly ProvenanceRecord
    Candidate relation: wasDerivedFrom / derivedFromSource or another provenance relation already selected by reuse
    Modeling note: introduce an assertion or provenance node only when provenance must attach to the claim itself rather than simply to the described resource.
    
    General extraction rule:
    - Extract only what is required to answer the CQ.
    - Mark classes, object properties, data properties, and axioms separately.
    - Treat domain/range, cardinality, reification, property characteristics, and equivalence as decisions requiring semantic evidence, not defaults.
    - Do not invent assertion classes or context classes unless information must actually be attached to the relation itself.
    ```
    
- {few_shot_data_properties} — new examples
    
    ```jsx
    # Example 1 — temporal value
    :releaseDate a owl:DatatypeProperty ;
        rdfs:domain :GameRelease ;
        rdfs:range xsd:date .
    
    # Example 2 — non-negative count
    :maxPlayerCount a owl:DatatypeProperty ;
        rdfs:domain :GameRelease ;
        rdfs:range xsd:nonNegativeInteger .
    
    # Example 3 — free text
    :reviewText a owl:DatatypeProperty ;
        rdfs:domain :Review ;
        rdfs:range xsd:string .
    
    # Example 4 — resource locator
    :sourceURL a owl:DatatypeProperty ;
        rdfs:domain :Source ;
        rdfs:range xsd:anyURI .
    
    # Example 5 — decimal value, only when the scale is genuinely numeric
    :normalizedRatingScore a owl:DatatypeProperty ;
        rdfs:domain :Rating ;
        rdfs:range xsd:decimal .
    # Use this only if the ontology explicitly normalizes ratings to a numeric scale; otherwise a string or structured rating model may be more appropriate.
    
    # Example 6 — boolean flag
    :isPlatformExclusive a owl:DatatypeProperty ;
        rdfs:domain :GameRelease ;
        rdfs:range xsd:boolean .
    # Use a boolean only when the concept is truly binary and does not require platform, region, or time context. Otherwise model the richer relation instead.
    
    # General rules
    # - Add a data property only if the ontology needs a literal-valued relation.
    # - Prefer established reusable properties such as dcterms:title or dcterms:identifier when their semantics already fit.
    # - Use the narrowest justified datatype.
    # - Do not create redundant pairs such as releaseDate and releaseYear unless both are independently required.
    # - Do not declare a data property functional unless at most one value is genuinely part of the intended semantics.
    ```
    
- {few_shot_individuals} — new examples
    
    ```jsx
    # Six minimal document-grounded examples.
    # They demonstrate instantiation only; they are not a list of individuals that must be copied.
    
    :Pong a :VideoGame ;
        rdfs:label "Pong"@en .
    
    :ComputerSpace a :VideoGame ;
        rdfs:label "Computer Space"@en .
    
    :Spacewar a :VideoGame ;
        rdfs:label "Spacewar!"@en .
    
    :MagnavoxOdyssey a :Platform ;
        rdfs:label "Magnavox Odyssey"@en .
    
    :GameBoy a :Platform ;
        rdfs:label "Game Boy"@en .
    
    :Nintendo a :Organization ;
        rdfs:label "Nintendo"@en .
    
    # General rules
    # - Instantiate only named entities supported by the document or another explicit source used by the ontology.
    # - Reuse classes and properties already present in the current ontology; do not create schema merely to fit a few-shot individual.
    # - Do not add factual relations or dates unless they are supported by the input evidence.
    # - Do not increase the number of individuals for its own sake.
    ```
    
- {persona}
    
    **Value:** Step 00 output.
    
    Step 01–20의 system/persona context로 동일한 값을 계속 사용한다.
    

## Runtime Variables — not global config

```
{previous_step_content}   # immediately preceding / accumulated step output
conceptual_model          # accumulated Step 05 + 06 + 07 conceptual triples
ontology_turtle           # accumulated Step 08 + append-style Step 09–20 Turtle
```

# Completed Baseline Through Step 02

<aside>
✅

**Step 03부터 다시 시작하기 위한 고정 baseline.** 기존 Step 01 specification의 내용은 유지하되 ontology-metrics와 subclass-count를 직접 요구하던 제약만 제외했다. Step 02는 현재의 selective-reuse 정책과 새 few-shot을 기준으로 다시 완료했다. 아래 `Step 01 + Step 02` 누적본을 Step 03의 `{previous_step_content}`로 사용한다.

</aside>

- Completed Step 01 — Specification baseline
    
    ```markdown
    # Video Game Ontology — NeOn Requirements Specification
    
    ## Purpose
    The purpose of the Video Game Ontology is to provide an interoperable and machine-readable semantic model for video games and their surrounding ecosystem. The ontology distinguishes an abstract video game work from a specific game release/version and from an individual gameplay session.
    
    It supports semantic integration, annotation, querying, automated reasoning, recommendation, preservation, research, and provenance-aware knowledge-graph construction.
    
    ## Scope
    The ontology covers:
    - Video games and game releases
    - Platforms
    - Developers and publishers
    - Genres and gameplay mechanics
    - Characters, including player and non-player characters
    - Input devices, including controllers, keyboards, touchscreens, motion sensors, microphones, webcams, and virtual-reality input devices
    - Output and display devices, including televisions, computer monitors, flat-panel displays, VR headsets, speakers, headphones, and haptic devices
    - Audiovisual and haptic feedback
    - Multiplayer modes and online services
    - Game engines
    - Ratings and reviews
    - Esports events
    - Gameplay sessions
    - In-game microphone communication and webcam-based livestreaming
    - Titles, identifiers, release dates, versions, and provenance
    - Platform adaptations such as ports, remasters, and remakes where required by the document and CQs
    - Physical and digital distribution, game media, downloadable content, modding, cloud gaming, and games-as-a-service where required by the document and CQs
    
    ## Target Group
    The target users include ontology engineers, knowledge-graph engineers, video-game database and catalog developers, game-studies researchers, digital-preservation specialists, game publishers and developers, recommendation-system developers, catalog integrators, rating/review data providers, and esports-data researchers.
    
    ## Intended Uses
    The ontology is intended for heterogeneous video-game data integration, semantic search, cross-platform catalog discovery, recommendation, automated reasoning, digital preservation, ratings/review integration, esports information management, Linked Open Data integration, and SPARQL-based querying.
    
    ## Functional Requirements
    FR1. Represent a VideoGame as an abstract work independently from a platform-specific or version-specific GameRelease.
    
    FR2. Represent a GameRelease as a release of exactly one VideoGame and as available on one or more Platforms.
    
    FR3. Represent Developer and Publisher as specializations of Organization.
    
    FR4. Represent Genres and GameplayMechanics associated with games.
    
    FR5. Represent Characters and distinguish PlayerCharacter from NonPlayerCharacter.
    
    FR6. Represent input support for Controller, Keyboard, Touchscreen, MotionSensor, Microphone, Webcam, and VirtualRealityDevice.
    
    FR7. Represent visual, audio, and haptic feedback through suitable output-device or output-capability concepts, including display, audio, VR, and haptic technologies.
    
    FR8. Represent GameplaySession independently of VideoGame and GameRelease.
    
    FR9. Represent the devices actually used during a GameplaySession.
    
    FR10. Represent microphone input used for in-game communication.
    
    FR11. Represent webcam input used for livestreaming.
    
    FR12. Represent MultiplayerMode and OnlineService capabilities.
    
    FR13. Represent GameEngine use and engine-supported Platforms.
    
    FR14. Represent Ratings and Reviews associated with GameReleases.
    
    FR15. Represent games participating in EsportsEvents.
    
    FR16. Represent titles, identifiers, versions, release dates, rating values, and review text.
    
    FR17. Preserve source/provenance links for integrated data.
    
    FR18. Support semantically justified inference through subclass relations, inverse properties, subproperties, property domains/ranges, functional properties, and cardinality restrictions.
    
    FR19. Support alignment with established vocabularies and external resources such as schema.org, SKOS, Dublin Core Terms, PROV-O, OWL-Time, FOAF, Wikidata, and DBpedia when semantic compatibility is established.
    
    ## Non-Functional Requirements
    NFR1. The core model should follow OWL 2 DL-compatible modeling practices.
    
    NFR5. The ontology must be modular and extensible.
    
    NFR6. Classes and properties must have understandable labels and use consistent naming conventions.
    
    NFR7. Ontology changes should follow versioning and deprecation practices.
    
    NFR8. Integrated assertions should preserve identifiers and provenance.
    
    NFR9. Closed-world validation constraints should be maintained in a separate SHACL graph rather than mixed into the OWL ontology.
    
    NFR10. The ontology should support efficient SPARQL querying and practical deployment in tools such as Protégé, GraphDB, and Apache Jena.
    ```
    
- Completed Step 02 — Reuse extension
    
    ```markdown
    # Step 02 — Ontology Reuse Extension
    
    The Step 01 specification is extended with the following reuse requirements and decisions.
    
    ## Reuse Strategy
    1. Reuse is selective and semantics-first. An external term is reused directly only when it expresses the intended local meaning without distortion.
    2. Do not create a local synonym for a generic concept or property that is already expressed adequately by a well-established vocabulary.
    3. When a local class or property is intentionally narrower than an external one, prefer an explicit rdfs:subClassOf or rdfs:subPropertyOf relation over an equivalence assertion.
    4. Use owl:equivalentClass and owl:equivalentProperty only when the meanings are genuinely equivalent in all intended interpretations.
    5. Use owl:sameAs only for true individual identity, never as a generic mapping shortcut.
    6. Prefer selective term reuse and lightweight alignment over importing an entire external ontology solely to obtain a small number of terms.
    7. Preserve the local distinction among abstract VideoGame, GameRelease, and GameplaySession even when an external vocabulary uses a coarser model.
    8. Reuse decisions must not create classes, properties, axioms, or individuals solely to make the ontology larger.
    
    ## Candidate Reuse
    ### Dublin Core Terms
    Use DCTerms directly for generic descriptive metadata such as title, identifier, source, description, and other metadata when its semantics are sufficient. If the ontology needs a genuinely narrower local property, relate it conservatively to the DCTerms property.
    
    ### SKOS
    Use SKOS for controlled terminology, preferred and alternative labels, concept schemes, and broader/narrower relations when genres, terminology, or other classifications are modeled as concepts. Do not create local label properties merely to mirror SKOS.
    
    ### PROV-O
    Use PROV-O for provenance where integrated entities, assertions, mappings, or reused resources need traceable derivation or attribution. Introduce an assertion/provenance node only when provenance must attach to the claim itself rather than simply to the described resource.
    
    ### OWL-Time
    Use OWL-Time when explicit temporal entities or relations among temporal entities are required. If a simple date, year, or timestamp literal is sufficient for a CQ, prefer the appropriate datatype property instead.
    
    ### schema.org / FOAF / other vocabularies
    Evaluate schema.org, FOAF, and other reusable vocabularies term by term. Do not assume equivalence from lexical similarity. Preserve local domain semantics when the external model is broader, narrower, or structurally different.
    
    ### Wikidata / DBpedia and other external identifiers
    Use external knowledge-graph links for identification and integration only when the identity or mapping is well supported. Preserve the source and, where relevant, the version or retrieval context of reused resources.
    
    ## Worked Reuse Decisions for This Domain
    The following are concrete, domain-specific reuse decisions derived from the completed specification. They are not mandatory templates; they document the intended semantic strength of reuse.
    
    ### 1. Generic metadata — direct DCTerms reuse
    For ordinary titles, identifiers, descriptions, dates, and sources, prefer DCTerms directly when no narrower video-game-specific semantics are required. A local alias should not be created merely for naming convenience.
    
    Example:
    ```
    
    :ExampleRelease
    
    dcterms:title "Example Release"@en ;
    
    dcterms:identifier "EX-001" ;
    
    dcterms:source :ExampleCatalog .
    
    ```
    
    ### 2. Genre terminology — SKOS concept scheme when classification semantics are sufficient
    Genre and subgenre terminology may be modeled as SKOS concepts when the requirement is vocabulary management, lexical labeling, or broader/narrower navigation rather than logical class membership.
    
    Example:
    ```
    
    :VideoGameGenreScheme a skos:ConceptScheme .
    
    :Shooter a skos:Concept ;
    
    skos:inScheme :VideoGameGenreScheme ;
    
    skos:prefLabel "Shooter"@en .
    
    :FirstPersonShooter a skos:Concept ;
    
    skos:inScheme :VideoGameGenreScheme ;
    
    skos:prefLabel "First-person shooter"@en ;
    
    skos:broader :Shooter .
    
    ```
    
    This does not prevent an OWL class model if later CQs require class-level reasoning; the choice is driven by the required semantics.
    
    ### 3. Developer/publisher participation — PROV qualified association when role context matters
    An organization is not globally forced to be a Developer or Publisher merely because it performs that role for one game or release. When role context must be represented, use a qualified association pattern.
    
    Example:
    ```
    
    :ReleaseA prov:qualifiedAssociation [
    
    a prov:Association ;
    
    prov:agent :StudioA ;
    
    prov:hadRole :DeveloperRole
    
    ] .
    
    ```
    
    This preserves the distinction between an agent and a context-dependent role. A simpler direct property remains acceptable when the CQs do not require role-level metadata.
    
    ### 4. Provenance of imported knowledge — PROV-O before custom provenance vocabulary
    Imported ratings, reviews, historical facts, mappings, or reused resources should preserve derivation and attribution using PROV-O where possible.
    
    Example:
    ```
    
    :ImportedRatingRecord a prov:Entity ;
    
    prov:wasDerivedFrom :SourceDataset ;
    
    prov:wasAttributedTo :RatingOrganization ;
    
    prov:generatedAtTime "2026-01-15T10:00:00Z"^^xsd:dateTime .
    
    ```
    
    Introduce a local provenance record class only when additional local semantics cannot be represented cleanly with PROV-O.
    
    ### 5. Temporal structure — literal first, OWL-Time when temporal entities are queried
    A simple release date should remain a literal. OWL-Time is introduced only when an interval, instant, duration, or temporal relation is itself part of the information requirement.
    
    Example:
    ```
    
    :ReleaseA dcterms:issued "2025-03-14"^^xsd:date .
    
    :ReleaseWindowA a time:Interval ;
    
    time:hasBeginning [ a time:Instant ; time:inXSDDate "2025-03-01"^^xsd:date ] ;
    
    time:hasEnd [ a time:Instant ; time:inXSDDate "2025-03-31"^^xsd:date ] .
    
    ```
    
    ### 6. External class alignment — conservative mapping strength
    If the local VideoGame class has a deliberately narrower definition than a broad external class, use a conservative subsumption relation rather than asserting equivalence.
    
    Example:
    ```
    
    :VideoGame rdfs:subClassOf schema:VideoGame .
    
    ```
    
    Do not use `owl:equivalentClass` unless the definitions and resulting entailments match in both directions. Likewise, `owl:sameAs` is reserved for true identity between individuals.
    
    ## Reuse Boundary
    Referencing external IRIs does not by itself require importing an entire external ontology. Use `owl:imports` only when the external ontology's axioms are intentionally required for reasoning. Each reuse decision must contribute to interoperability, semantic precision, CQ answerability, or provenance and must not blur the local distinctions among VideoGame, GameRelease, and GameplaySession.
    
    ## Reuse Requirements Added to the Specification
    RR1. The ontology shall evaluate direct reuse before creating a semantically redundant local term.
    
    RR2. Every subclass, subproperty, SKOS mapping, OWL equivalence, or identity link to an external resource shall reflect the actual semantic strength of the relationship.
    
    RR3. Terminological reuse shall preserve preferred labels, alternative labels, and broader/narrower structure where those distinctions are required.
    
    RR4. Provenance shall be preserved for integrated assertions and externally reused resources where traceability matters.
    
    RR5. Temporal modeling shall use literal values when sufficient and explicit temporal entities only when required by the information need.
    
    RR6. Reuse shall not collapse the VideoGame–GameRelease–GameplaySession distinction established by the specification.
    
    RR7. Reuse shall not force the local ontology to adopt external modeling choices that conflict with the document or competency questions.
    
    RR8. The origin and, where available, version of reused ontology resources shall be documentable.
    
    ## Step 02 Result
    The ontology specification is now complete enough to generate competency questions. Step 03 must derive its questions from the full document plus this cumulative Step 01–02 specification. The reuse examples are guidance for modeling decisions, not a predetermined ontology schema.
    ```
    

# Regenerated Step 03 — CQ50

<aside>
🧪

**Fresh CQ set generated from the completed Step 01–02 baseline.** These are information requirements, not a preview of the final ontology schema.

</aside>

- Step 03 output — CQ1–CQ50
    
    ```
    CQ1. Which abstract VideoGame is a particular GameRelease a release of?
    
    CQ2. Which GameRelease instances belong to a particular abstract VideoGame?
    
    CQ3. On which Platform or Platforms is a particular GameRelease available?
    
    CQ4. What title, identifier, version, and release date are recorded for a particular GameRelease?
    
    CQ5. How is a particular port, conversion, remaster, or remake related to an earlier VideoGame or GameRelease?
    
    CQ6. Is a particular GameRelease exclusive to a Platform or platform holder, or is it available across multiple platforms?
    
    CQ7. Which VideoGame and GameRelease are associated with a particular GameplaySession?
    
    CQ8. What type of Platform is a particular platform, such as personal computer, home console, handheld console, arcade system, browser platform, mobile platform, cloud-gaming platform, or virtual-reality platform?
    
    CQ9. Which Organization manufactures, owns, or otherwise acts as platform holder for a particular Platform?
    
    CQ10. Which newer Platforms are backward-compatible with a particular older Platform or its games?
    
    CQ11. Which games or releases can be executed through emulation on a Platform different from the one for which they were originally intended?
    
    CQ12. Which physical or digital media format is used to distribute or install a particular GameRelease?
    
    CQ13. Is a particular GameRelease distributed through physical media, digital download, cloud delivery, or another distribution method?
    
    CQ14. Which expansion packs or downloadable-content resources extend a particular VideoGame or GameRelease?
    
    CQ15. Which user-generated-content or modification resources are associated with a particular VideoGame, and are they officially supported or user-created where that distinction is represented?
    
    CQ16. Through which OnlineService or cloud-gaming service can a particular VideoGame or GameRelease be accessed?
    
    CQ17. Which InputDevice types are supported by a particular VideoGame or GameRelease?
    
    CQ18. Which InputDevice types are required for a particular GameRelease and which are only optionally supported?
    
    CQ19. Which input devices were actually used during a particular GameplaySession?
    
    CQ20. Which OutputDevice or display technologies can be used to present the output of a particular VideoGame or GameRelease?
    
    CQ21. Which visual, audio, or haptic feedback capabilities are provided by a particular VideoGame, GameRelease, or Platform?
    
    CQ22. Which GameplaySessions used microphone input for in-game communication?
    
    CQ23. Which GameplaySessions used webcam input for livestreaming?
    
    CQ24. Which VideoGames or GameReleases support virtual-reality input, virtual-reality output, or both?
    
    CQ25. Which Genre classifications apply to a particular VideoGame?
    
    CQ26. What broader and narrower Genre classifications are related to a particular Genre?
    
    CQ27. Which GameplayMechanics are associated with a particular VideoGame?
    
    CQ28. Which game mode classifications apply to a particular VideoGame or GameRelease, such as single-player, multiplayer, or zero-player?
    
    CQ29. For a multiplayer VideoGame or GameRelease, is play supported locally on one device, over a local network, or over the Internet?
    
    CQ30. Does a particular multiplayer VideoGame or GameRelease support competitive, cooperative, team-based, asymmetric, or massively multiplayer play?
    
    CQ31. What maximum number of players is supported by a particular VideoGame or GameRelease when that information is available?
    
    CQ32. Which broad game-type classifications apply to a particular VideoGame, such as core, casual, educational, serious, or art game?
    
    CQ33. Which Characters are associated with a particular VideoGame, and which of them are PlayerCharacters or NonPlayerCharacters?
    
    CQ34. Which Organizations developed a particular VideoGame or GameRelease?
    
    CQ35. Which Organizations published or distributed a particular VideoGame or GameRelease, and what role did each organization perform?
    
    CQ36. Which GameEngine was used to develop a particular VideoGame or GameRelease, and which Platforms does that engine support where that information is represented?
    
    CQ37. Which monetization or service model is associated with a particular VideoGame or GameRelease, including games-as-a-service where applicable?
    
    CQ38. Which Rating or content-rating classification applies to a particular GameRelease, and which rating system issued it?
    
    CQ39. Which age category or content descriptors are associated with a particular rating of a GameRelease?
    
    CQ40. Which Reviews concern a particular GameRelease, and what review text or rating value is recorded for each review where available?
    
    CQ41. Which preferred or alternative terms have been used for the concept of a video game, and what regional, linguistic, or historical context is associated with those terms when represented?
    
    CQ42. Which VideoGames, Platforms, Organizations, or industry events are associated with a particular historical date or period represented in the document?
    
    CQ43. Which earlier VideoGame, Platform, or other resource influenced or preceded a particular historically significant game or platform when such a relationship is represented?
    
    CQ44. In which EsportsEvents or competitive contexts does a particular VideoGame or GameRelease participate?
    
    CQ45. Which source or provenance record supports a particular rating, review, esports, historical, or other integrated assertion?
    
    CQ46. Which external identifier or knowledge-graph resource is linked to a particular VideoGame, GameRelease, Platform, Organization, or other modeled entity?
    
    CQ47. Which generic metadata values for a modeled resource are represented using reused vocabulary terms such as title, identifier, description, or source?
    
    CQ48. Which controlled terminology concepts have preferred labels, alternative labels, broader concepts, or narrower concepts through reused terminology vocabularies such as SKOS?
    
    CQ49. From which external ontology, dataset, or source—and, when available, which version—was a reused or integrated resource derived?
    
    CQ50. Which more specific resources can be retrieved through broader ontology categories or property hierarchies, such as retrieving specialized input devices as InputDevices, specialized organizations as Organizations, or narrower genre concepts through broader Genre classifications?
    ```
    

## System Prompt for Step 01–20

```
{persona}
```

- Step 00 — Domain-specific Persona Generation
    
    ```
    Based on the provided domain name and domain document, define a detailed professional persona for ontology engineering.
    
    The persona must:
    1. Reflect deep familiarity with the domain, its terminology, standards, tools, datasets, and relevant knowledge sources.
    2. Reflect expertise in ontology engineering and semantic web technologies, including RDF, RDFS, OWL, SPARQL, Turtle, modular ontology design, ontology reuse, alignment, validation, and reasoning.
    3. Be realistic and directly usable as the system context for an LLM carrying out the complete ontology-development pipeline.
    4. Treat the supplied domain document as the primary domain grounding while using expert ontology-engineering knowledge to model it accurately.
    
    Domain Name:
    {domain_name}
    
    Domain Document:
    ###start_document###
    {document}
    ###end_document###
    
    Output only the persona text.
    ```
    
- Step 01 — Specification
    
    ```
    You are a {persona}.
    
    Develop the ontology specification for the {domain_name} domain using the NeOn methodology.
    Use the full domain document below as the primary source. Consider the entire document, not just a snippet.
    Use the following keywords when they are relevant to the document and domain: {keywords}.
    
    Domain Document:
    ###start_document###
    {document}
    ###end_document###
    
    Specify the following ontology requirements as completely as possible:
    - Purpose of the ontology
    - Scope of the ontology
    - Target group of the ontology
    - Intended uses
    - Functional requirements
    - Non-functional requirements
    
    Do not optimize for a target number of classes, properties, axioms, or individuals.
    The goal is complete and semantically appropriate coverage of the domain described by the document.
    ```
    
- Step 02 — Reuse
    
    ```
    Based on the ontology specifications previously developed using the NeOn methodology and shown below, extend and improve them through ontology reuse principles.
    
    Ontology Specification Text:
    ###start_previous_specification###
    {previous_step_content}
    ###end_previous_specification###
    
    The ontology should accurately represent the complexity and hierarchical structure of the domain.
    It should be detailed, with well-defined hierarchy levels and interconnected relationships between concepts where semantically justified.
    
    Reuse refers to utilizing existing ontological knowledge or structures as input in the development of new ontologies. Use reuse to improve interoperability and consistency, but do not force an external term when its semantics do not match the local domain meaning.
    
    Use the following reuse input when it is semantically applicable.
    Reuse description:
    {reuse_example_desc}
    
    Human-provided reference examples:
    {few_shot_reuse}
    
    Treat these as small reference slices that indicate useful domain structures, not as complete ontology modules or mandatory mappings. Use your ontology-engineering expertise to determine the appropriate formalization, vocabulary reuse, alignment, hierarchy, and axioms. Preserve the accepted specification and domain-document semantics; if an example conflicts with an explicit accepted requirement, the accepted requirement takes precedence.
    
    Extend the specification with appropriate reuse candidates, mappings, alignments, or modeling patterns.
    ```
    
- Step 03 — Competency Questions
    
    ```
    Based on the full Ontology Specifications and Requirements already developed, and grounded in the complete domain document below, write exactly 50 Competency Questions that the core ontology should be able to answer.
    
    Ontology Requirements:
    ###start_previous_specification###
    {previous_step_content}
    ###end_previous_specification###
    
    Domain Document:
    ###start_document###
    {document}
    ###end_document###
    
    Requirements for the 50 Competency Questions:
    - Generate exactly CQ1 through CQ50.
    - Cover the full information scope expressed by the document and ontology requirements.
    - Avoid paraphrase-only duplicates.
    - Include both simple and compositional information needs where appropriate.
    - Each CQ must imply information that can be represented and queried in the ontology.
    - Do not constrain the questions to a target ontology size.
    
    Here are examples of Competency Questions to guide the style and level of specificity:
    {few_shot_cqs}
    
    Output only the 50 numbered Competency Questions.
    ```
    
- step 03 output
    
    ```markdown
    CQ1. Which abstract VideoGame is a particular GameRelease a release of?
    
    CQ2. Which GameRelease instances belong to a particular abstract VideoGame?
    
    CQ3. On which Platform or Platforms is a particular GameRelease available?
    
    CQ4. What title, identifier, version, and release date are recorded for a particular GameRelease?
    
    CQ5. How is a particular port, conversion, remaster, or remake related to an earlier VideoGame or GameRelease?
    
    CQ6. Is a particular GameRelease exclusive to a Platform or platform holder, or is it available across multiple platforms?
    
    CQ7. Which VideoGame and GameRelease are associated with a particular GameplaySession?
    
    CQ8. What type of Platform is a particular platform, such as personal computer, home console, handheld console, arcade system, browser platform, mobile platform, cloud-gaming platform, or virtual-reality platform?
    
    CQ9. Which Organization manufactures, owns, or otherwise acts as platform holder for a particular Platform?
    
    CQ10. Which newer Platforms are backward-compatible with a particular older Platform or its games?
    
    CQ11. Which games or releases can be executed through emulation on a Platform different from the one for which they were originally intended?
    
    CQ12. Which physical or digital media format is used to distribute or install a particular GameRelease?
    
    CQ13. Is a particular GameRelease distributed through physical media, digital download, cloud delivery, or another distribution method?
    
    CQ14. Which expansion packs or downloadable-content resources extend a particular VideoGame or GameRelease?
    
    CQ15. Which user-generated-content or modification resources are associated with a particular VideoGame, and are they officially supported or user-created where that distinction is represented?
    
    CQ16. Through which OnlineService or cloud-gaming service can a particular VideoGame or GameRelease be accessed?
    
    CQ17. Which InputDevice types are supported by a particular VideoGame or GameRelease?
    
    CQ18. Which InputDevice types are required for a particular GameRelease and which are only optionally supported?
    
    CQ19. Which input devices were actually used during a particular GameplaySession?
    
    CQ20. Which OutputDevice or display technologies can be used to present the output of a particular VideoGame or GameRelease?
    
    CQ21. Which visual, audio, or haptic feedback capabilities are provided by a particular VideoGame, GameRelease, or Platform?
    
    CQ22. Which GameplaySessions used microphone input for in-game communication?
    
    CQ23. Which GameplaySessions used webcam input for livestreaming?
    
    CQ24. Which VideoGames or GameReleases support virtual-reality input, virtual-reality output, or both?
    
    CQ25. Which Genre classifications apply to a particular VideoGame?
    
    CQ26. What broader and narrower Genre classifications are related to a particular Genre?
    
    CQ27. Which GameplayMechanics are associated with a particular VideoGame?
    
    CQ28. Which game mode classifications apply to a particular VideoGame or GameRelease, such as single-player, multiplayer, or zero-player?
    
    CQ29. For a multiplayer VideoGame or GameRelease, is play supported locally on one device, over a local network, or over the Internet?
    
    CQ30. Does a particular multiplayer VideoGame or GameRelease support competitive, cooperative, team-based, asymmetric, or massively multiplayer play?
    
    CQ31. What maximum number of players is supported by a particular VideoGame or GameRelease when that information is available?
    
    CQ32. Which broad game-type classifications apply to a particular VideoGame, such as core, casual, educational, serious, or art game?
    
    CQ33. Which Characters are associated with a particular VideoGame, and which of them are PlayerCharacters or NonPlayerCharacters?
    
    CQ34. Which Organizations developed a particular VideoGame or GameRelease?
    
    CQ35. Which Organizations published or distributed a particular VideoGame or GameRelease, and what role did each organization perform?
    
    CQ36. Which GameEngine was used to develop a particular VideoGame or GameRelease, and which Platforms does that engine support where that information is represented?
    
    CQ37. Which monetization or service model is associated with a particular VideoGame or GameRelease, including games-as-a-service where applicable?
    
    CQ38. Which Rating or content-rating classification applies to a particular GameRelease, and which rating system issued it?
    
    CQ39. Which age category or content descriptors are associated with a particular rating of a GameRelease?
    
    CQ40. Which Reviews concern a particular GameRelease, and what review text or rating value is recorded for each review where available?
    
    CQ41. Which preferred or alternative terms have been used for the concept of a video game, and what regional, linguistic, or historical context is associated with those terms when represented?
    
    CQ42. Which VideoGames, Platforms, Organizations, or industry events are associated with a particular historical date or period represented in the document?
    
    CQ43. Which earlier VideoGame, Platform, or other resource influenced or preceded a particular historically significant game or platform when such a relationship is represented?
    
    CQ44. In which EsportsEvents or competitive contexts does a particular VideoGame or GameRelease participate?
    
    CQ45. Which source or provenance record supports a particular rating, review, esports, historical, or other integrated assertion?
    
    CQ46. Which external identifier or knowledge-graph resource is linked to a particular VideoGame, GameRelease, Platform, Organization, or other modeled entity?
    
    CQ47. Which generic metadata values for a modeled resource are represented using reused vocabulary terms such as title, identifier, description, or source?
    
    CQ48. Which controlled terminology concepts have preferred labels, alternative labels, broader concepts, or narrower concepts through reused terminology vocabularies such as SKOS?
    
    CQ49. From which external ontology, dataset, or source—and, when available, which version—was a reused or integrated resource derived?
    
    CQ50. Which more specific resources can be retrieved through broader ontology categories or property hierarchies, such as retrieving specialized input devices as InputDevices, specialized organizations as Organizations, or narrower genre concepts through broader Genre classifications?
    ```
    
- Step 04 — Entity, Relation, and Axiom Extraction
    
    ```
    For each of the 50 Competency Questions, extract all entities, relations (properties), and axioms that must be introduced in the ontology.
    A single Competency Question can require more than one triple or axiom.
    Do this for all CQ1 through CQ50, not just a snippet.
    
    Competency Questions:
    ###start_previous_competency_questions###
    {previous_step_content}
    ###end_previous_competency_questions###
    
    Domain Document:
    ###start_document###
    {document}
    ###end_document###
    
    Use the domain document to disambiguate terms and modeling choices.
    Do not invent a class, relation, axiom, or individual solely to make the ontology larger.
    
    Here are some examples to guide entity/relation/axiom extraction:
    {few_shot_entity_extraction}
    
    Return the complete extraction for all 50 Competency Questions.
    ```
    
- step 04 output
    
    ```markdown
    ?release rdf:type :GameRelease .
    ?game rdf:type :VideoGame .
    ?platform rdf:type :Platform .
    ?organization rdf:type :Organization .
    ?session rdf:type :GameplaySession .
    ?genre rdf:type :Genre .
    ?mechanic rdf:type :GameplayMechanic .
    ?service rdf:type :OnlineService .
    ?concept rdf:type skos:Concept .
    
    ?release :releaseOf ?game .
    
    ?release :availableOnPlatform ?platform .
    ?release :exclusiveToPlatform ?platform .
    ?release :exclusiveToPlatformHolder ?organization .
    
    ?release :title ?title .
    ?release :identifier ?identifier .
    ?release :version ?version .
    ?release :releaseDate ?date .
    
    ?resource :derivedFrom ?earlierResource .
    ?resource :portOf ?earlierResource .
    ?resource :conversionOf ?earlierResource .
    ?resource :remasterOf ?earlierResource .
    ?resource :remakeOf ?earlierResource .
    
    ?session :usesGameRelease ?release .
    
    ?platform :manufacturedBy ?organization .
    ?platform :ownedBy ?organization .
    ?platform :hasPlatformHolder ?organization .
    ?newPlatform :backwardCompatibleWith ?oldPlatform .
    
    ?gameOrRelease :intendedForPlatform ?originalPlatform .
    ?gameOrRelease :emulatableOnPlatform ?targetPlatform .
    
    ?release :usesMediaFormat ?mediaFormat .
    ?release :distributedVia ?distributionMethod .
    
    ?extension :extendsResource ?gameOrRelease .
    
    ?content :associatedWithGame ?game .
    ?content :officiallySupported ?boolean .
    ?content :userCreated ?boolean .
    
    ?gameOrRelease :accessibleViaOnlineService ?service .
    
    ?gameOrRelease :supportsInputDevice ?inputDevice .
    ?release :requiresInputDevice ?inputDevice .
    ?release :optionallySupportsInputDevice ?inputDevice .
    
    ?session :usedInputDevice ?inputDevice .
    ?session :usedMicrophoneForInGameCommunication ?microphone .
    ?session :usedWebcamForLivestreaming ?webcam .
    
    ?gameOrRelease :supportsOutputDevice ?outputDevice .
    ?gameOrRelease :supportsDisplayTechnology ?displayTechnology .
    ?resource :providesFeedbackCapability ?feedbackCapability .
    
    ?game :hasGenre ?genre .
    ?genre skos:broader ?broaderGenre .
    ?genre skos:narrower ?narrowerGenre .
    
    ?game :hasGameplayMechanic ?mechanic .
    
    ?gameOrRelease :hasGameMode ?gameMode .
    ?gameOrRelease :supportsMultiplayerConnectivity ?connectivityMode .
    ?gameOrRelease :supportsMultiplayerStyle ?multiplayerStyle .
    ?gameOrRelease :maximumPlayerCount ?count .
    
    ?game :hasCharacter ?character .
    
    ?gameOrRelease :developedBy ?organization .
    ?gameOrRelease :publishedBy ?organization .
    ?gameOrRelease :distributedBy ?organization .
    
    ?gameOrRelease :developedWithEngine ?engine .
    ?engine :engineSupportsPlatform ?platform .
    
    ?gameOrRelease :hasMonetizationModel ?model .
    
    ?release :hasContentRating ?rating .
    ?rating :issuedByRatingSystem ?ratingSystem .
    ?rating :ratingCode ?ratingCode .
    ?rating :hasAgeCategory ?ageCategory .
    ?rating :hasContentDescriptor ?descriptor .
    ?rating :minimumAge ?age .
    
    ?review :reviewsRelease ?release .
    ?review :reviewText ?reviewText .
    ?review :reviewRatingValue ?reviewRatingValue .
    
    ?concept skosxl:prefLabel ?preferredLabel .
    ?concept skosxl:altLabel ?alternativeLabel .
    ?label skosxl:literalForm ?literalForm .
    ?label :associatedWithRegion ?region .
    ?label :associatedWithHistoricalPeriod ?period .
    
    ?resource :associatedWithHistoricalPeriod ?period .
    ?resource :historicalDate ?historicalDate .
    ?period :periodStart ?periodStart .
    ?period :periodEnd ?periodEnd .
    
    ?resource :influencedBy ?earlierResource .
    ?resource :precededBy ?earlierResource .
    
    ?gameOrRelease :participatesInCompetitiveContext ?competitiveContext .
    
    ?resource prov:wasDerivedFrom ?source .
    ?resource prov:hadPrimarySource ?source .
    ?resource :hasProvenanceRecord ?provenanceRecord .
    
    ?resource :externalResourceLink ?externalResource .
    ?resource :externalIdentifier ?externalIdentifier .
    ?resource owl:sameAs ?externalResource .
    ?resource skos:exactMatch ?externalResource .
    
    ?resource dcterms:title ?title .
    ?resource dcterms:identifier ?identifier .
    ?resource dcterms:description ?description .
    ?resource dcterms:source ?source .
    
    ?concept skos:prefLabel ?preferredLabel .
    ?concept skos:altLabel ?alternativeLabel .
    ?concept skos:broader ?broaderConcept .
    ?concept skos:narrower ?narrowerConcept .
    
    ?source :sourceVersion ?version .
    
    :portOf rdfs:subPropertyOf :derivedFrom .
    :conversionOf rdfs:subPropertyOf :derivedFrom .
    :remasterOf rdfs:subPropertyOf :derivedFrom .
    :remakeOf rdfs:subPropertyOf :derivedFrom .
    
    :exclusiveToPlatform rdfs:subPropertyOf :availableOnPlatform .
    
    :distributedOnMediaFormat rdfs:subPropertyOf :usesMediaFormat .
    :installedFromMediaFormat rdfs:subPropertyOf :usesMediaFormat .
    
    :requiresInputDevice rdfs:subPropertyOf :supportsInputDevice .
    :optionallySupportsInputDevice rdfs:subPropertyOf :supportsInputDevice .
    
    :usedMicrophoneForInGameCommunication
        rdfs:subPropertyOf :usedInputDevice .
    
    :usedWebcamForLivestreaming
        rdfs:subPropertyOf :usedInputDevice .
    
    :PersonalComputerPlatform rdfs:subClassOf :Platform .
    :HomeConsole rdfs:subClassOf :Platform .
    :HandheldConsole rdfs:subClassOf :Platform .
    :ArcadeSystem rdfs:subClassOf :Platform .
    :BrowserPlatform rdfs:subClassOf :Platform .
    :MobilePlatform rdfs:subClassOf :Platform .
    :CloudGamingPlatform rdfs:subClassOf :Platform .
    :VirtualRealityPlatform rdfs:subClassOf :Platform .
    
    :PhysicalMediaFormat rdfs:subClassOf :MediaFormat .
    :DigitalMediaFormat rdfs:subClassOf :MediaFormat .
    :ROMCartridge rdfs:subClassOf :PhysicalMediaFormat .
    :MagneticTape rdfs:subClassOf :PhysicalMediaFormat .
    :FloppyDisk rdfs:subClassOf :PhysicalMediaFormat .
    :OpticalDisc rdfs:subClassOf :PhysicalMediaFormat .
    :CDROM rdfs:subClassOf :OpticalDisc .
    :DVD rdfs:subClassOf :OpticalDisc .
    :FlashMemoryCard rdfs:subClassOf :PhysicalMediaFormat .
    
    :ExpansionPack rdfs:subClassOf :GameExtension .
    :DownloadableContent rdfs:subClassOf :GameExtension .
    
    :CloudGamingService rdfs:subClassOf :OnlineService .
    
    :GameController rdfs:subClassOf :InputDevice .
    :Gamepad rdfs:subClassOf :InputDevice .
    :Joystick rdfs:subClassOf :InputDevice .
    :Keyboard rdfs:subClassOf :InputDevice .
    :Mouse rdfs:subClassOf :InputDevice .
    :Touchscreen rdfs:subClassOf :InputDevice .
    :MotionSensor rdfs:subClassOf :InputDevice .
    :RacingWheel rdfs:subClassOf :InputDevice .
    :LightGun rdfs:subClassOf :InputDevice .
    :DancePad rdfs:subClassOf :InputDevice .
    :DigitalCamera rdfs:subClassOf :InputDevice .
    :Microphone rdfs:subClassOf :InputDevice .
    :Webcam rdfs:subClassOf :InputDevice .
    :VRInputDevice rdfs:subClassOf :InputDevice .
    :VRController rdfs:subClassOf :VRInputDevice .
    
    :DisplayDevice rdfs:subClassOf :OutputDevice .
    :CRTDisplay rdfs:subClassOf :DisplayDevice .
    :LCDDisplay rdfs:subClassOf :DisplayDevice .
    :BuiltInScreen rdfs:subClassOf :DisplayDevice .
    :Projector rdfs:subClassOf :DisplayDevice .
    :ComputerMonitor rdfs:subClassOf :DisplayDevice .
    :VRHeadset rdfs:subClassOf :DisplayDevice .
    :VRHeadset rdfs:subClassOf :VROutputDevice .
    :VROutputDevice rdfs:subClassOf :OutputDevice .
    :Speaker rdfs:subClassOf :OutputDevice .
    :Headphones rdfs:subClassOf :OutputDevice .
    
    :VisualFeedbackCapability rdfs:subClassOf :FeedbackCapability .
    :AudioFeedbackCapability rdfs:subClassOf :FeedbackCapability .
    :HapticFeedbackCapability rdfs:subClassOf :FeedbackCapability .
    
    :CoreGame rdfs:subClassOf :VideoGame .
    :CasualGame rdfs:subClassOf :VideoGame .
    :SeriousGame rdfs:subClassOf :VideoGame .
    :EducationalGame rdfs:subClassOf :SeriousGame .
    :ArtGame rdfs:subClassOf :VideoGame .
    
    :PlayerCharacter rdfs:subClassOf :Character .
    :NonPlayerCharacter rdfs:subClassOf :Character .
    
    :EsportsEvent rdfs:subClassOf :CompetitiveContext .
    
    :PhysicalMediaDistribution rdf:type :DistributionMethod .
    :DigitalDownload rdf:type :DistributionMethod .
    :CloudDelivery rdf:type :DistributionMethod .
    
    :SinglePlayer rdf:type :GameMode .
    :Multiplayer rdf:type :GameMode .
    :ZeroPlayer rdf:type :GameMode .
    
    :LocalSameDevice rdf:type :MultiplayerConnectivityMode .
    :LocalNetwork rdf:type :MultiplayerConnectivityMode .
    :InternetOnline rdf:type :MultiplayerConnectivityMode .
    
    :Competitive rdf:type :MultiplayerStyle .
    :Cooperative rdf:type :MultiplayerStyle .
    :TeamBased rdf:type :MultiplayerStyle .
    :Asymmetric rdf:type :MultiplayerStyle .
    :MassivelyMultiplayer rdf:type :MultiplayerStyle .
    
    :GamesAsAService rdf:type :MonetizationModel .
    
    :ESRB rdf:type :RatingSystem .
    :PEGI rdf:type :RatingSystem .
    :ACB rdf:type :RatingSystem .
    :CERO rdf:type :RatingSystem .
    :USK rdf:type :RatingSystem .
    ```
    
- Step 05 — Initial Conceptual Model
    
    ```
    Considering all generated entities, relations (properties), and axioms from the previous step, generate a conceptual model expressing them as subject–relation–object triples.
    
    Previous Extraction:
    ###start_previous_extraction###
    {previous_step_content}
    ###end_previous_extraction###
    
    Do it for all entities, properties, and axioms, not just a snippet.
    
    Make sure that the conceptual model is logically consistent and free from common ontology-modeling pitfalls, including wrong inverse relationships, unintended cycles in the class hierarchy, inappropriate domains or ranges, and unjustified transitive relationships.
    
    Output the complete conceptual model as triples in the format:
    (subject — relation — object)
    ```
    
- step 05 output
    
    ```markdown
    (?release — rdf:type — :GameRelease)
    (?game — rdf:type — :VideoGame)
    (?platform — rdf:type — :Platform)
    (?organization — rdf:type — :Organization)
    (?session — rdf:type — :GameplaySession)
    (?genre — rdf:type — :Genre)
    (?mechanic — rdf:type — :GameplayMechanic)
    (?service — rdf:type — :OnlineService)
    (?concept — rdf:type — skos:Concept)
    
    (?release — :releaseOf — ?game)
    
    (?release — :availableOnPlatform — ?platform)
    (?release — :exclusiveToPlatform — ?platform)
    (?release — :exclusiveToPlatformHolder — ?organization)
    
    (?release — :title — ?title)
    (?release — :identifier — ?identifier)
    (?release — :version — ?version)
    (?release — :releaseDate — ?date)
    
    (?resource — :derivedFrom — ?earlierResource)
    (?resource — :portOf — ?earlierResource)
    (?resource — :conversionOf — ?earlierResource)
    (?resource — :remasterOf — ?earlierResource)
    (?resource — :remakeOf — ?earlierResource)
    
    (?session — :usesGameRelease — ?release)
    
    (?platform — :manufacturedBy — ?organization)
    (?platform — :ownedBy — ?organization)
    (?platform — :hasPlatformHolder — ?organization)
    (?newPlatform — :backwardCompatibleWith — ?oldPlatform)
    
    (?gameOrRelease — :intendedForPlatform — ?originalPlatform)
    (?gameOrRelease — :emulatableOnPlatform — ?targetPlatform)
    
    (?release — :usesMediaFormat — ?mediaFormat)
    (?release — :distributedVia — ?distributionMethod)
    
    (?extension — :extendsResource — ?gameOrRelease)
    
    (?content — :associatedWithGame — ?game)
    (?content — :officiallySupported — ?boolean)
    (?content — :userCreated — ?boolean)
    
    (?gameOrRelease — :accessibleViaOnlineService — ?service)
    
    (?gameOrRelease — :supportsInputDevice — ?inputDevice)
    (?release — :requiresInputDevice — ?inputDevice)
    (?release — :optionallySupportsInputDevice — ?inputDevice)
    
    (?session — :usedInputDevice — ?inputDevice)
    (?session — :usedMicrophoneForInGameCommunication — ?microphone)
    (?session — :usedWebcamForLivestreaming — ?webcam)
    
    (?gameOrRelease — :supportsOutputDevice — ?outputDevice)
    (?gameOrRelease — :supportsDisplayTechnology — ?displayTechnology)
    (?resource — :providesFeedbackCapability — ?feedbackCapability)
    
    (?game — :hasGenre — ?genre)
    (?genre — skos:broader — ?broaderGenre)
    (?genre — skos:narrower — ?narrowerGenre)
    
    (?game — :hasGameplayMechanic — ?mechanic)
    
    (?gameOrRelease — :hasGameMode — ?gameMode)
    (?gameOrRelease — :supportsMultiplayerConnectivity — ?connectivityMode)
    (?gameOrRelease — :supportsMultiplayerStyle — ?multiplayerStyle)
    (?gameOrRelease — :maximumPlayerCount — ?count)
    
    (?game — :hasCharacter — ?character)
    
    (?gameOrRelease — :developedBy — ?organization)
    (?gameOrRelease — :publishedBy — ?organization)
    (?gameOrRelease — :distributedBy — ?organization)
    
    (?gameOrRelease — :developedWithEngine — ?engine)
    (?engine — :engineSupportsPlatform — ?platform)
    
    (?gameOrRelease — :hasMonetizationModel — ?model)
    
    (?release — :hasContentRating — ?rating)
    (?rating — :issuedByRatingSystem — ?ratingSystem)
    (?rating — :ratingCode — ?ratingCode)
    (?rating — :hasAgeCategory — ?ageCategory)
    (?rating — :hasContentDescriptor — ?descriptor)
    (?rating — :minimumAge — ?age)
    
    (?review — :reviewsRelease — ?release)
    (?review — :reviewText — ?reviewText)
    (?review — :reviewRatingValue — ?reviewRatingValue)
    
    (?concept — skosxl:prefLabel — ?preferredLabel)
    (?concept — skosxl:altLabel — ?alternativeLabel)
    (?label — skosxl:literalForm — ?literalForm)
    (?label — :associatedWithRegion — ?region)
    (?label — :associatedWithHistoricalPeriod — ?period)
    
    (?resource — :associatedWithHistoricalPeriod — ?period)
    (?resource — :historicalDate — ?historicalDate)
    (?period — :periodStart — ?periodStart)
    (?period — :periodEnd — ?periodEnd)
    
    (?resource — :influencedBy — ?earlierResource)
    (?resource — :precededBy — ?earlierResource)
    
    (?gameOrRelease — :participatesInCompetitiveContext — ?competitiveContext)
    
    (?resource — prov:wasDerivedFrom — ?source)
    (?resource — prov:hadPrimarySource — ?source)
    (?resource — :hasProvenanceRecord — ?provenanceRecord)
    
    (?resource — :externalResourceLink — ?externalResource)
    (?resource — :externalIdentifier — ?externalIdentifier)
    (?resource — owl:sameAs — ?externalResource)
    (?resource — skos:exactMatch — ?externalResource)
    
    (?resource — dcterms:title — ?title)
    (?resource — dcterms:identifier — ?identifier)
    (?resource — dcterms:description — ?description)
    (?resource — dcterms:source — ?source)
    
    (?concept — skos:prefLabel — ?preferredLabel)
    (?concept — skos:altLabel — ?alternativeLabel)
    (?concept — skos:broader — ?broaderConcept)
    (?concept — skos:narrower — ?narrowerConcept)
    
    (?source — :sourceVersion — ?version)
    
    (:portOf — rdfs:subPropertyOf — :derivedFrom)
    (:conversionOf — rdfs:subPropertyOf — :derivedFrom)
    (:remasterOf — rdfs:subPropertyOf — :derivedFrom)
    (:remakeOf — rdfs:subPropertyOf — :derivedFrom)
    
    (:exclusiveToPlatform — rdfs:subPropertyOf — :availableOnPlatform)
    
    (:distributedOnMediaFormat — rdfs:subPropertyOf — :usesMediaFormat)
    (:installedFromMediaFormat — rdfs:subPropertyOf — :usesMediaFormat)
    
    (:requiresInputDevice — rdfs:subPropertyOf — :supportsInputDevice)
    (:optionallySupportsInputDevice — rdfs:subPropertyOf — :supportsInputDevice)
    
    (:usedMicrophoneForInGameCommunication — rdfs:subPropertyOf — :usedInputDevice)
    (:usedWebcamForLivestreaming — rdfs:subPropertyOf — :usedInputDevice)
    
    (:PersonalComputerPlatform — rdfs:subClassOf — :Platform)
    (:HomeConsole — rdfs:subClassOf — :Platform)
    (:HandheldConsole — rdfs:subClassOf — :Platform)
    (:ArcadeSystem — rdfs:subClassOf — :Platform)
    (:BrowserPlatform — rdfs:subClassOf — :Platform)
    (:MobilePlatform — rdfs:subClassOf — :Platform)
    (:CloudGamingPlatform — rdfs:subClassOf — :Platform)
    (:VirtualRealityPlatform — rdfs:subClassOf — :Platform)
    
    (:PhysicalMediaFormat — rdfs:subClassOf — :MediaFormat)
    (:DigitalMediaFormat — rdfs:subClassOf — :MediaFormat)
    (:ROMCartridge — rdfs:subClassOf — :PhysicalMediaFormat)
    (:MagneticTape — rdfs:subClassOf — :PhysicalMediaFormat)
    (:FloppyDisk — rdfs:subClassOf — :PhysicalMediaFormat)
    (:OpticalDisc — rdfs:subClassOf — :PhysicalMediaFormat)
    (:CDROM — rdfs:subClassOf — :OpticalDisc)
    (:DVD — rdfs:subClassOf — :OpticalDisc)
    (:FlashMemoryCard — rdfs:subClassOf — :PhysicalMediaFormat)
    
    (:ExpansionPack — rdfs:subClassOf — :GameExtension)
    (:DownloadableContent — rdfs:subClassOf — :GameExtension)
    
    (:CloudGamingService — rdfs:subClassOf — :OnlineService)
    
    (:GameController — rdfs:subClassOf — :InputDevice)
    (:Gamepad — rdfs:subClassOf — :InputDevice)
    (:Joystick — rdfs:subClassOf — :InputDevice)
    (:Keyboard — rdfs:subClassOf — :InputDevice)
    (:Mouse — rdfs:subClassOf — :InputDevice)
    (:Touchscreen — rdfs:subClassOf — :InputDevice)
    (:MotionSensor — rdfs:subClassOf — :InputDevice)
    (:RacingWheel — rdfs:subClassOf — :InputDevice)
    (:LightGun — rdfs:subClassOf — :InputDevice)
    (:DancePad — rdfs:subClassOf — :InputDevice)
    (:DigitalCamera — rdfs:subClassOf — :InputDevice)
    (:Microphone — rdfs:subClassOf — :InputDevice)
    (:Webcam — rdfs:subClassOf — :InputDevice)
    (:VRInputDevice — rdfs:subClassOf — :InputDevice)
    (:VRController — rdfs:subClassOf — :VRInputDevice)
    
    (:DisplayDevice — rdfs:subClassOf — :OutputDevice)
    (:CRTDisplay — rdfs:subClassOf — :DisplayDevice)
    (:LCDDisplay — rdfs:subClassOf — :DisplayDevice)
    (:BuiltInScreen — rdfs:subClassOf — :DisplayDevice)
    (:Projector — rdfs:subClassOf — :DisplayDevice)
    (:ComputerMonitor — rdfs:subClassOf — :DisplayDevice)
    (:VRHeadset — rdfs:subClassOf — :DisplayDevice)
    (:VRHeadset — rdfs:subClassOf — :VROutputDevice)
    (:VROutputDevice — rdfs:subClassOf — :OutputDevice)
    (:Speaker — rdfs:subClassOf — :OutputDevice)
    (:Headphones — rdfs:subClassOf — :OutputDevice)
    
    (:VisualFeedbackCapability — rdfs:subClassOf — :FeedbackCapability)
    (:AudioFeedbackCapability — rdfs:subClassOf — :FeedbackCapability)
    (:HapticFeedbackCapability — rdfs:subClassOf — :FeedbackCapability)
    
    (:CoreGame — rdfs:subClassOf — :VideoGame)
    (:CasualGame — rdfs:subClassOf — :VideoGame)
    (:SeriousGame — rdfs:subClassOf — :VideoGame)
    (:EducationalGame — rdfs:subClassOf — :SeriousGame)
    (:ArtGame — rdfs:subClassOf — :VideoGame)
    
    (:PlayerCharacter — rdfs:subClassOf — :Character)
    (:NonPlayerCharacter — rdfs:subClassOf — :Character)
    
    (:EsportsEvent — rdfs:subClassOf — :CompetitiveContext)
    
    (:PhysicalMediaDistribution — rdf:type — :DistributionMethod)
    (:DigitalDownload — rdf:type — :DistributionMethod)
    (:CloudDelivery — rdf:type — :DistributionMethod)
    
    (:SinglePlayer — rdf:type — :GameMode)
    (:Multiplayer — rdf:type — :GameMode)
    (:ZeroPlayer — rdf:type — :GameMode)
    
    (:LocalSameDevice — rdf:type — :MultiplayerConnectivityMode)
    (:LocalNetwork — rdf:type — :MultiplayerConnectivityMode)
    (:InternetOnline — rdf:type — :MultiplayerConnectivityMode)
    
    (:Competitive — rdf:type — :MultiplayerStyle)
    (:Cooperative — rdf:type — :MultiplayerStyle)
    (:TeamBased — rdf:type — :MultiplayerStyle)
    (:Asymmetric — rdf:type — :MultiplayerStyle)
    (:MassivelyMultiplayer — rdf:type — :MultiplayerStyle)
    
    (:GamesAsAService — rdf:type — :MonetizationModel)
    
    (:ESRB — rdf:type — :RatingSystem)
    (:PEGI — rdf:type — :RatingSystem)
    (:ACB — rdf:type — :RatingSystem)
    (:CERO — rdf:type — :RatingSystem)
    (:USK — rdf:type — :RatingSystem)
    ```
    
- Step 06 — Extend Conceptual Model — First Refinement
    
    ```
    Extend the conceptual model using the following keywords when relevant: {keywords}.
    Reuse Example: {reuse_example_desc} {few_shot_reuse}
    
    Current Conceptual Model:
    ###start_previous_conceptual_model###
    {previous_step_content}
    ###end_previous_conceptual_model###
    
    Using your domain and ontology-engineering expertise, add missing entities, relations (properties), and axioms that improve completeness, interoperability, or the ability to answer the Competency Questions.
    
    Do not add concepts merely to increase ontology size.
    Do not introduce strong logical axioms unless their semantics justify them.
    
    Print only the new triples in the format:
    (subject — relation — object)
    
    Ensure that the additions are logically consistent and do not duplicate existing triples.
    ```
    
- Step 06 output
    
    ```markdown
    (?release — rdf:type — :GameRelease)
    (?game — rdf:type — :VideoGame)
    (?platform — rdf:type — :Platform)
    (?organization — rdf:type — :Organization)
    (?session — rdf:type — :GameplaySession)
    (?genre — rdf:type — :Genre)
    (?mechanic — rdf:type — :GameplayMechanic)
    (?service — rdf:type — :OnlineService)
    (?concept — rdf:type — skos:Concept)
    
    (?release — :releaseOf — ?game)
    
    (?release — :availableOnPlatform — ?platform)
    (?release — :exclusiveToPlatform — ?platform)
    (?release — :exclusiveToPlatformHolder — ?organization)
    
    (?release — :title — ?title)
    (?release — :identifier — ?identifier)
    (?release — :version — ?version)
    (?release — :releaseDate — ?date)
    
    (?resource — :derivedFrom — ?earlierResource)
    (?resource — :portOf — ?earlierResource)
    (?resource — :conversionOf — ?earlierResource)
    (?resource — :remasterOf — ?earlierResource)
    (?resource — :remakeOf — ?earlierResource)
    
    (?session — :usesGameRelease — ?release)
    
    (?platform — :manufacturedBy — ?organization)
    (?platform — :ownedBy — ?organization)
    (?platform — :hasPlatformHolder — ?organization)
    (?newPlatform — :backwardCompatibleWith — ?oldPlatform)
    
    (?gameOrRelease — :intendedForPlatform — ?originalPlatform)
    (?gameOrRelease — :emulatableOnPlatform — ?targetPlatform)
    
    (?release — :usesMediaFormat — ?mediaFormat)
    (?release — :distributedVia — ?distributionMethod)
    
    (?extension — :extendsResource — ?gameOrRelease)
    
    (?content — :associatedWithGame — ?game)
    (?content — :officiallySupported — ?boolean)
    (?content — :userCreated — ?boolean)
    
    (?gameOrRelease — :accessibleViaOnlineService — ?service)
    
    (?gameOrRelease — :supportsInputDevice — ?inputDevice)
    (?release — :requiresInputDevice — ?inputDevice)
    (?release — :optionallySupportsInputDevice — ?inputDevice)
    
    (?session — :usedInputDevice — ?inputDevice)
    (?session — :usedMicrophoneForInGameCommunication — ?microphone)
    (?session — :usedWebcamForLivestreaming — ?webcam)
    
    (?gameOrRelease — :supportsOutputDevice — ?outputDevice)
    (?gameOrRelease — :supportsDisplayTechnology — ?displayTechnology)
    (?resource — :providesFeedbackCapability — ?feedbackCapability)
    
    (?game — :hasGenre — ?genre)
    (?genre — skos:broader — ?broaderGenre)
    (?genre — skos:narrower — ?narrowerGenre)
    
    (?game — :hasGameplayMechanic — ?mechanic)
    
    (?gameOrRelease — :hasGameMode — ?gameMode)
    (?gameOrRelease — :supportsMultiplayerConnectivity — ?connectivityMode)
    (?gameOrRelease — :supportsMultiplayerStyle — ?multiplayerStyle)
    (?gameOrRelease — :maximumPlayerCount — ?count)
    
    (?game — :hasCharacter — ?character)
    
    (?gameOrRelease — :developedBy — ?organization)
    (?gameOrRelease — :publishedBy — ?organization)
    (?gameOrRelease — :distributedBy — ?organization)
    
    (?gameOrRelease — :developedWithEngine — ?engine)
    (?engine — :engineSupportsPlatform — ?platform)
    
    (?gameOrRelease — :hasMonetizationModel — ?model)
    
    (?release — :hasContentRating — ?rating)
    (?rating — :issuedByRatingSystem — ?ratingSystem)
    (?rating — :ratingCode — ?ratingCode)
    (?rating — :hasAgeCategory — ?ageCategory)
    (?rating — :hasContentDescriptor — ?descriptor)
    (?rating — :minimumAge — ?age)
    
    (?review — :reviewsRelease — ?release)
    (?review — :reviewText — ?reviewText)
    (?review — :reviewRatingValue — ?reviewRatingValue)
    
    (?concept — skosxl:prefLabel — ?preferredLabel)
    (?concept — skosxl:altLabel — ?alternativeLabel)
    (?label — skosxl:literalForm — ?literalForm)
    (?label — :associatedWithRegion — ?region)
    (?label — :associatedWithHistoricalPeriod — ?period)
    
    (?resource — :associatedWithHistoricalPeriod — ?period)
    (?resource — :historicalDate — ?historicalDate)
    (?period — :periodStart — ?periodStart)
    (?period — :periodEnd — ?periodEnd)
    
    (?resource — :influencedBy — ?earlierResource)
    (?resource — :precededBy — ?earlierResource)
    
    (?gameOrRelease — :participatesInCompetitiveContext — ?competitiveContext)
    
    (?resource — prov:wasDerivedFrom — ?source)
    (?resource — prov:hadPrimarySource — ?source)
    (?resource — :hasProvenanceRecord — ?provenanceRecord)
    
    (?resource — :externalResourceLink — ?externalResource)
    (?resource — :externalIdentifier — ?externalIdentifier)
    (?resource — owl:sameAs — ?externalResource)
    (?resource — skos:exactMatch — ?externalResource)
    
    (?resource — dcterms:title — ?title)
    (?resource — dcterms:identifier — ?identifier)
    (?resource — dcterms:description — ?description)
    (?resource — dcterms:source — ?source)
    
    (?concept — skos:prefLabel — ?preferredLabel)
    (?concept — skos:altLabel — ?alternativeLabel)
    (?concept — skos:broader — ?broaderConcept)
    (?concept — skos:narrower — ?narrowerConcept)
    
    (?source — :sourceVersion — ?version)
    
    (:portOf — rdfs:subPropertyOf — :derivedFrom)
    (:conversionOf — rdfs:subPropertyOf — :derivedFrom)
    (:remasterOf — rdfs:subPropertyOf — :derivedFrom)
    (:remakeOf — rdfs:subPropertyOf — :derivedFrom)
    
    (:exclusiveToPlatform — rdfs:subPropertyOf — :availableOnPlatform)
    
    (:distributedOnMediaFormat — rdfs:subPropertyOf — :usesMediaFormat)
    (:installedFromMediaFormat — rdfs:subPropertyOf — :usesMediaFormat)
    
    (:requiresInputDevice — rdfs:subPropertyOf — :supportsInputDevice)
    (:optionallySupportsInputDevice — rdfs:subPropertyOf — :supportsInputDevice)
    
    (:usedMicrophoneForInGameCommunication — rdfs:subPropertyOf — :usedInputDevice)
    (:usedWebcamForLivestreaming — rdfs:subPropertyOf — :usedInputDevice)
    
    (:PersonalComputerPlatform — rdfs:subClassOf — :Platform)
    (:HomeConsole — rdfs:subClassOf — :Platform)
    (:HandheldConsole — rdfs:subClassOf — :Platform)
    (:ArcadeSystem — rdfs:subClassOf — :Platform)
    (:BrowserPlatform — rdfs:subClassOf — :Platform)
    (:MobilePlatform — rdfs:subClassOf — :Platform)
    (:CloudGamingPlatform — rdfs:subClassOf — :Platform)
    (:VirtualRealityPlatform — rdfs:subClassOf — :Platform)
    
    (:PhysicalMediaFormat — rdfs:subClassOf — :MediaFormat)
    (:DigitalMediaFormat — rdfs:subClassOf — :MediaFormat)
    (:ROMCartridge — rdfs:subClassOf — :PhysicalMediaFormat)
    (:MagneticTape — rdfs:subClassOf — :PhysicalMediaFormat)
    (:FloppyDisk — rdfs:subClassOf — :PhysicalMediaFormat)
    (:OpticalDisc — rdfs:subClassOf — :PhysicalMediaFormat)
    (:CDROM — rdfs:subClassOf — :OpticalDisc)
    (:DVD — rdfs:subClassOf — :OpticalDisc)
    (:FlashMemoryCard — rdfs:subClassOf — :PhysicalMediaFormat)
    
    (:ExpansionPack — rdfs:subClassOf — :GameExtension)
    (:DownloadableContent — rdfs:subClassOf — :GameExtension)
    
    (:CloudGamingService — rdfs:subClassOf — :OnlineService)
    
    (:GameController — rdfs:subClassOf — :InputDevice)
    (:Gamepad — rdfs:subClassOf — :InputDevice)
    (:Joystick — rdfs:subClassOf — :InputDevice)
    (:Keyboard — rdfs:subClassOf — :InputDevice)
    (:Mouse — rdfs:subClassOf — :InputDevice)
    (:Touchscreen — rdfs:subClassOf — :InputDevice)
    (:MotionSensor — rdfs:subClassOf — :InputDevice)
    (:RacingWheel — rdfs:subClassOf — :InputDevice)
    (:LightGun — rdfs:subClassOf — :InputDevice)
    (:DancePad — rdfs:subClassOf — :InputDevice)
    (:DigitalCamera — rdfs:subClassOf — :InputDevice)
    (:Microphone — rdfs:subClassOf — :InputDevice)
    (:Webcam — rdfs:subClassOf — :InputDevice)
    (:VRInputDevice — rdfs:subClassOf — :InputDevice)
    (:VRController — rdfs:subClassOf — :VRInputDevice)
    
    (:DisplayDevice — rdfs:subClassOf — :OutputDevice)
    (:CRTDisplay — rdfs:subClassOf — :DisplayDevice)
    (:LCDDisplay — rdfs:subClassOf — :DisplayDevice)
    (:BuiltInScreen — rdfs:subClassOf — :DisplayDevice)
    (:Projector — rdfs:subClassOf — :DisplayDevice)
    (:ComputerMonitor — rdfs:subClassOf — :DisplayDevice)
    (:VRHeadset — rdfs:subClassOf — :DisplayDevice)
    (:VRHeadset — rdfs:subClassOf — :VROutputDevice)
    (:VROutputDevice — rdfs:subClassOf — :OutputDevice)
    (:Speaker — rdfs:subClassOf — :OutputDevice)
    (:Headphones — rdfs:subClassOf — :OutputDevice)
    
    (:VisualFeedbackCapability — rdfs:subClassOf — :FeedbackCapability)
    (:AudioFeedbackCapability — rdfs:subClassOf — :FeedbackCapability)
    (:HapticFeedbackCapability — rdfs:subClassOf — :FeedbackCapability)
    
    (:CoreGame — rdfs:subClassOf — :VideoGame)
    (:CasualGame — rdfs:subClassOf — :VideoGame)
    (:SeriousGame — rdfs:subClassOf — :VideoGame)
    (:EducationalGame — rdfs:subClassOf — :SeriousGame)
    (:ArtGame — rdfs:subClassOf — :VideoGame)
    
    (:PlayerCharacter — rdfs:subClassOf — :Character)
    (:NonPlayerCharacter — rdfs:subClassOf — :Character)
    
    (:EsportsEvent — rdfs:subClassOf — :CompetitiveContext)
    
    (:PhysicalMediaDistribution — rdf:type — :DistributionMethod)
    (:DigitalDownload — rdf:type — :DistributionMethod)
    (:CloudDelivery — rdf:type — :DistributionMethod)
    
    (:SinglePlayer — rdf:type — :GameMode)
    (:Multiplayer — rdf:type — :GameMode)
    (:ZeroPlayer — rdf:type — :GameMode)
    
    (:LocalSameDevice — rdf:type — :MultiplayerConnectivityMode)
    (:LocalNetwork — rdf:type — :MultiplayerConnectivityMode)
    (:InternetOnline — rdf:type — :MultiplayerConnectivityMode)
    
    (:Competitive — rdf:type — :MultiplayerStyle)
    (:Cooperative — rdf:type — :MultiplayerStyle)
    (:TeamBased — rdf:type — :MultiplayerStyle)
    (:Asymmetric — rdf:type — :MultiplayerStyle)
    (:MassivelyMultiplayer — rdf:type — :MultiplayerStyle)
    
    (:GamesAsAService — rdf:type — :MonetizationModel)
    
    (:ESRB — rdf:type — :RatingSystem)
    (:PEGI — rdf:type — :RatingSystem)
    (:ACB — rdf:type — :RatingSystem)
    (:CERO — rdf:type — :RatingSystem)
    (:USK — rdf:type — :RatingSystem)
    
    (:GameResource — rdf:type — owl:Class)
    (:VideoGame — rdfs:subClassOf — :GameResource)
    (:GameRelease — rdfs:subClassOf — :GameResource)
    
    (:VideoGame — rdfs:subClassOf — schema:VideoGame)
    (:Organization — rdfs:subClassOf — schema:Organization)
    (:Review — rdfs:subClassOf — schema:Review)
    (:Genre — rdfs:subClassOf — skos:Concept)
    
    (:title — rdfs:subPropertyOf — dcterms:title)
    (:identifier — rdfs:subPropertyOf — dcterms:identifier)
    (:externalIdentifier — rdfs:subPropertyOf — dcterms:identifier)
    (:releaseDate — rdfs:subPropertyOf — dcterms:issued)
    (:historicalDate — rdfs:subPropertyOf — dcterms:date)
    (:derivedFrom — rdfs:subPropertyOf — prov:wasDerivedFrom)
    
    (:releaseOf — rdfs:domain — :GameRelease)
    (:releaseOf — rdfs:range — :VideoGame)
    (:availableOnPlatform — rdfs:domain — :GameRelease)
    (:availableOnPlatform — rdfs:range — :Platform)
    (:hasGenre — rdfs:domain — :VideoGame)
    (:hasGenre — rdfs:range — :Genre)
    
    (?mediaFormat — rdf:type — :MediaFormat)
    (?distributionMethod — rdf:type — :DistributionMethod)
    (?extension — rdf:type — :GameExtension)
    (?inputDevice — rdf:type — :InputDevice)
    (?outputDevice — rdf:type — :OutputDevice)
    (?displayTechnology — rdf:type — :DisplayTechnology)
    (?feedbackCapability — rdf:type — :FeedbackCapability)
    (?gameMode — rdf:type — :GameMode)
    (?connectivityMode — rdf:type — :MultiplayerConnectivityMode)
    (?multiplayerStyle — rdf:type — :MultiplayerStyle)
    (?character — rdf:type — :Character)
    (?engine — rdf:type — :GameEngine)
    (?model — rdf:type — :MonetizationModel)
    (?rating — rdf:type — :ContentRating)
    (?ratingSystem — rdf:type — :RatingSystem)
    (?review — rdf:type — :Review)
    (?region — rdf:type — :Region)
    (?period — rdf:type — :HistoricalPeriod)
    (?competitiveContext — rdf:type — :CompetitiveContext)
    
    (?release — :distributedOnMediaFormat — ?mediaFormat)
    (?release — :installedFromMediaFormat — ?mediaFormat)
    (?release — :availableInRegion — ?region)
    
    (?gameOrRelease — :hasParticipatingOrganization — ?organization)
    (:developedBy — rdfs:subPropertyOf — :hasParticipatingOrganization)
    (:publishedBy — rdfs:subPropertyOf — :hasParticipatingOrganization)
    (:distributedBy — rdfs:subPropertyOf — :hasParticipatingOrganization)
    
    (?gameOrRelease — prov:qualifiedAssociation — ?association)
    (?association — rdf:type — prov:Association)
    (?association — prov:agent — ?organization)
    (?association — prov:hadRole — ?role)
    (?role — rdf:type — prov:Role)
    (:DeveloperRole — rdf:type — prov:Role)
    (:PublisherRole — rdf:type — prov:Role)
    (:DistributorRole — rdf:type — prov:Role)
    
    (:ProvenanceRecord — rdfs:subClassOf — prov:Entity)
    (:hasProvenanceRecord — rdfs:range — :ProvenanceRecord)
    (?provenanceRecord — rdf:type — :ProvenanceRecord)
    (?provenanceRecord — prov:wasDerivedFrom — ?source)
    (?provenanceRecord — prov:wasAttributedTo — ?organization)
    (?provenanceRecord — prov:generatedAtTime — ?generatedAtTime)
    
    (?preferredLabel — rdf:type — skosxl:Label)
    (?alternativeLabel — rdf:type — skosxl:Label)
    
    (?release — :hasReleaseWindow — ?releaseWindow)
    (?releaseWindow — rdf:type — time:Interval)
    (?releaseWindow — time:hasBeginning — ?releaseStart)
    (?releaseWindow — time:hasEnd — ?releaseEnd)
    (?releaseStart — rdf:type — time:Instant)
    (?releaseEnd — rdf:type — time:Instant)
    (?releaseStart — time:inXSDDate — ?startDate)
    (?releaseEnd — time:inXSDDate — ?endDate)
    
    (?game — :partOfSeries — ?series)
    (?series — rdf:type — :VideoGameSeries)
    (:partOfSeries — rdfs:subPropertyOf — dcterms:isPartOf)
    
    (:Gamepad — rdfs:subClassOf — :GameController)
    (:Joystick — rdfs:subClassOf — :GameController)
    (:RacingWheel — rdfs:subClassOf — :GameController)
    (:LightGun — rdfs:subClassOf — :GameController)
    (:DancePad — rdfs:subClassOf — :GameController)
    (:VRController — rdfs:subClassOf — :GameController)
    ```
    
- Step 07 — Extend Conceptual Model — Second Refinement
    
    ```
    Further extend the conceptual model using the following keywords when relevant: {keywords}.
    Reuse Example: {reuse_example_desc} {few_shot_reuse}
    
    Current Conceptual Model:
    ###start_previous_conceptual_model###
    {previous_step_content}
    ###end_previous_conceptual_model###
    
    Using your domain expertise, identify any remaining missing entities, relations (properties), or axioms needed for a complete and coherent conceptual model.
    
    Add only semantically justified content that is not already represented.
    Do not add content merely to increase ontology size.
    
    Print only the new triples in the format:
    (subject — relation — object)
    
    Ensure logical consistency and avoid duplicate triples and common ontology-modeling pitfalls.
    ```
    
- step 07 output
    
    ```markdown
    (?release — rdf:type — :GameRelease)
    (?game — rdf:type — :VideoGame)
    (?platform — rdf:type — :Platform)
    (?organization — rdf:type — :Organization)
    (?session — rdf:type — :GameplaySession)
    (?genre — rdf:type — :Genre)
    (?mechanic — rdf:type — :GameplayMechanic)
    (?service — rdf:type — :OnlineService)
    (?concept — rdf:type — skos:Concept)
    
    (?release — :releaseOf — ?game)
    
    (?release — :availableOnPlatform — ?platform)
    (?release — :exclusiveToPlatform — ?platform)
    (?release — :exclusiveToPlatformHolder — ?organization)
    
    (?release — :title — ?title)
    (?release — :identifier — ?identifier)
    (?release — :version — ?version)
    (?release — :releaseDate — ?date)
    
    (?resource — :derivedFrom — ?earlierResource)
    (?resource — :portOf — ?earlierResource)
    (?resource — :conversionOf — ?earlierResource)
    (?resource — :remasterOf — ?earlierResource)
    (?resource — :remakeOf — ?earlierResource)
    
    (?session — :usesGameRelease — ?release)
    
    (?platform — :manufacturedBy — ?organization)
    (?platform — :ownedBy — ?organization)
    (?platform — :hasPlatformHolder — ?organization)
    (?newPlatform — :backwardCompatibleWith — ?oldPlatform)
    
    (?gameOrRelease — :intendedForPlatform — ?originalPlatform)
    (?gameOrRelease — :emulatableOnPlatform — ?targetPlatform)
    
    (?release — :usesMediaFormat — ?mediaFormat)
    (?release — :distributedVia — ?distributionMethod)
    
    (?extension — :extendsResource — ?gameOrRelease)
    
    (?content — :associatedWithGame — ?game)
    (?content — :officiallySupported — ?boolean)
    (?content — :userCreated — ?boolean)
    
    (?gameOrRelease — :accessibleViaOnlineService — ?service)
    
    (?gameOrRelease — :supportsInputDevice — ?inputDevice)
    (?release — :requiresInputDevice — ?inputDevice)
    (?release — :optionallySupportsInputDevice — ?inputDevice)
    
    (?session — :usedInputDevice — ?inputDevice)
    (?session — :usedMicrophoneForInGameCommunication — ?microphone)
    (?session — :usedWebcamForLivestreaming — ?webcam)
    
    (?gameOrRelease — :supportsOutputDevice — ?outputDevice)
    (?gameOrRelease — :supportsDisplayTechnology — ?displayTechnology)
    (?resource — :providesFeedbackCapability — ?feedbackCapability)
    
    (?game — :hasGenre — ?genre)
    (?genre — skos:broader — ?broaderGenre)
    (?genre — skos:narrower — ?narrowerGenre)
    
    (?game — :hasGameplayMechanic — ?mechanic)
    
    (?gameOrRelease — :hasGameMode — ?gameMode)
    (?gameOrRelease — :supportsMultiplayerConnectivity — ?connectivityMode)
    (?gameOrRelease — :supportsMultiplayerStyle — ?multiplayerStyle)
    (?gameOrRelease — :maximumPlayerCount — ?count)
    
    (?game — :hasCharacter — ?character)
    
    (?gameOrRelease — :developedBy — ?organization)
    (?gameOrRelease — :publishedBy — ?organization)
    (?gameOrRelease — :distributedBy — ?organization)
    
    (?gameOrRelease — :developedWithEngine — ?engine)
    (?engine — :engineSupportsPlatform — ?platform)
    
    (?gameOrRelease — :hasMonetizationModel — ?model)
    
    (?release — :hasContentRating — ?rating)
    (?rating — :issuedByRatingSystem — ?ratingSystem)
    (?rating — :ratingCode — ?ratingCode)
    (?rating — :hasAgeCategory — ?ageCategory)
    (?rating — :hasContentDescriptor — ?descriptor)
    (?rating — :minimumAge — ?age)
    
    (?review — :reviewsRelease — ?release)
    (?review — :reviewText — ?reviewText)
    (?review — :reviewRatingValue — ?reviewRatingValue)
    
    (?concept — skosxl:prefLabel — ?preferredLabel)
    (?concept — skosxl:altLabel — ?alternativeLabel)
    (?label — skosxl:literalForm — ?literalForm)
    (?label — :associatedWithRegion — ?region)
    (?label — :associatedWithHistoricalPeriod — ?period)
    
    (?resource — :associatedWithHistoricalPeriod — ?period)
    (?resource — :historicalDate — ?historicalDate)
    (?period — :periodStart — ?periodStart)
    (?period — :periodEnd — ?periodEnd)
    
    (?resource — :influencedBy — ?earlierResource)
    (?resource — :precededBy — ?earlierResource)
    
    (?gameOrRelease — :participatesInCompetitiveContext — ?competitiveContext)
    
    (?resource — prov:wasDerivedFrom — ?source)
    (?resource — prov:hadPrimarySource — ?source)
    (?resource — :hasProvenanceRecord — ?provenanceRecord)
    
    (?resource — :externalResourceLink — ?externalResource)
    (?resource — :externalIdentifier — ?externalIdentifier)
    (?resource — owl:sameAs — ?externalResource)
    (?resource — skos:exactMatch — ?externalResource)
    
    (?resource — dcterms:title — ?title)
    (?resource — dcterms:identifier — ?identifier)
    (?resource — dcterms:description — ?description)
    (?resource — dcterms:source — ?source)
    
    (?concept — skos:prefLabel — ?preferredLabel)
    (?concept — skos:altLabel — ?alternativeLabel)
    (?concept — skos:broader — ?broaderConcept)
    (?concept — skos:narrower — ?narrowerConcept)
    
    (?source — :sourceVersion — ?version)
    
    (:portOf — rdfs:subPropertyOf — :derivedFrom)
    (:conversionOf — rdfs:subPropertyOf — :derivedFrom)
    (:remasterOf — rdfs:subPropertyOf — :derivedFrom)
    (:remakeOf — rdfs:subPropertyOf — :derivedFrom)
    
    (:exclusiveToPlatform — rdfs:subPropertyOf — :availableOnPlatform)
    
    (:distributedOnMediaFormat — rdfs:subPropertyOf — :usesMediaFormat)
    (:installedFromMediaFormat — rdfs:subPropertyOf — :usesMediaFormat)
    
    (:requiresInputDevice — rdfs:subPropertyOf — :supportsInputDevice)
    (:optionallySupportsInputDevice — rdfs:subPropertyOf — :supportsInputDevice)
    
    (:usedMicrophoneForInGameCommunication — rdfs:subPropertyOf — :usedInputDevice)
    (:usedWebcamForLivestreaming — rdfs:subPropertyOf — :usedInputDevice)
    
    (:PersonalComputerPlatform — rdfs:subClassOf — :Platform)
    (:HomeConsole — rdfs:subClassOf — :Platform)
    (:HandheldConsole — rdfs:subClassOf — :Platform)
    (:ArcadeSystem — rdfs:subClassOf — :Platform)
    (:BrowserPlatform — rdfs:subClassOf — :Platform)
    (:MobilePlatform — rdfs:subClassOf — :Platform)
    (:CloudGamingPlatform — rdfs:subClassOf — :Platform)
    (:VirtualRealityPlatform — rdfs:subClassOf — :Platform)
    
    (:PhysicalMediaFormat — rdfs:subClassOf — :MediaFormat)
    (:DigitalMediaFormat — rdfs:subClassOf — :MediaFormat)
    (:ROMCartridge — rdfs:subClassOf — :PhysicalMediaFormat)
    (:MagneticTape — rdfs:subClassOf — :PhysicalMediaFormat)
    (:FloppyDisk — rdfs:subClassOf — :PhysicalMediaFormat)
    (:OpticalDisc — rdfs:subClassOf — :PhysicalMediaFormat)
    (:CDROM — rdfs:subClassOf — :OpticalDisc)
    (:DVD — rdfs:subClassOf — :OpticalDisc)
    (:FlashMemoryCard — rdfs:subClassOf — :PhysicalMediaFormat)
    
    (:ExpansionPack — rdfs:subClassOf — :GameExtension)
    (:DownloadableContent — rdfs:subClassOf — :GameExtension)
    
    (:CloudGamingService — rdfs:subClassOf — :OnlineService)
    
    (:GameController — rdfs:subClassOf — :InputDevice)
    (:Gamepad — rdfs:subClassOf — :InputDevice)
    (:Joystick — rdfs:subClassOf — :InputDevice)
    (:Keyboard — rdfs:subClassOf — :InputDevice)
    (:Mouse — rdfs:subClassOf — :InputDevice)
    (:Touchscreen — rdfs:subClassOf — :InputDevice)
    (:MotionSensor — rdfs:subClassOf — :InputDevice)
    (:RacingWheel — rdfs:subClassOf — :InputDevice)
    (:LightGun — rdfs:subClassOf — :InputDevice)
    (:DancePad — rdfs:subClassOf — :InputDevice)
    (:DigitalCamera — rdfs:subClassOf — :InputDevice)
    (:Microphone — rdfs:subClassOf — :InputDevice)
    (:Webcam — rdfs:subClassOf — :InputDevice)
    (:VRInputDevice — rdfs:subClassOf — :InputDevice)
    (:VRController — rdfs:subClassOf — :VRInputDevice)
    
    (:DisplayDevice — rdfs:subClassOf — :OutputDevice)
    (:CRTDisplay — rdfs:subClassOf — :DisplayDevice)
    (:LCDDisplay — rdfs:subClassOf — :DisplayDevice)
    (:BuiltInScreen — rdfs:subClassOf — :DisplayDevice)
    (:Projector — rdfs:subClassOf — :DisplayDevice)
    (:ComputerMonitor — rdfs:subClassOf — :DisplayDevice)
    (:VRHeadset — rdfs:subClassOf — :DisplayDevice)
    (:VRHeadset — rdfs:subClassOf — :VROutputDevice)
    (:VROutputDevice — rdfs:subClassOf — :OutputDevice)
    (:Speaker — rdfs:subClassOf — :OutputDevice)
    (:Headphones — rdfs:subClassOf — :OutputDevice)
    
    (:VisualFeedbackCapability — rdfs:subClassOf — :FeedbackCapability)
    (:AudioFeedbackCapability — rdfs:subClassOf — :FeedbackCapability)
    (:HapticFeedbackCapability — rdfs:subClassOf — :FeedbackCapability)
    
    (:CoreGame — rdfs:subClassOf — :VideoGame)
    (:CasualGame — rdfs:subClassOf — :VideoGame)
    (:SeriousGame — rdfs:subClassOf — :VideoGame)
    (:EducationalGame — rdfs:subClassOf — :SeriousGame)
    (:ArtGame — rdfs:subClassOf — :VideoGame)
    
    (:PlayerCharacter — rdfs:subClassOf — :Character)
    (:NonPlayerCharacter — rdfs:subClassOf — :Character)
    
    (:EsportsEvent — rdfs:subClassOf — :CompetitiveContext)
    
    (:PhysicalMediaDistribution — rdf:type — :DistributionMethod)
    (:DigitalDownload — rdf:type — :DistributionMethod)
    (:CloudDelivery — rdf:type — :DistributionMethod)
    
    (:SinglePlayer — rdf:type — :GameMode)
    (:Multiplayer — rdf:type — :GameMode)
    (:ZeroPlayer — rdf:type — :GameMode)
    
    (:LocalSameDevice — rdf:type — :MultiplayerConnectivityMode)
    (:LocalNetwork — rdf:type — :MultiplayerConnectivityMode)
    (:InternetOnline — rdf:type — :MultiplayerConnectivityMode)
    
    (:Competitive — rdf:type — :MultiplayerStyle)
    (:Cooperative — rdf:type — :MultiplayerStyle)
    (:TeamBased — rdf:type — :MultiplayerStyle)
    (:Asymmetric — rdf:type — :MultiplayerStyle)
    (:MassivelyMultiplayer — rdf:type — :MultiplayerStyle)
    
    (:GamesAsAService — rdf:type — :MonetizationModel)
    
    (:ESRB — rdf:type — :RatingSystem)
    (:PEGI — rdf:type — :RatingSystem)
    (:ACB — rdf:type — :RatingSystem)
    (:CERO — rdf:type — :RatingSystem)
    (:USK — rdf:type — :RatingSystem)
    
    (:GameResource — rdf:type — owl:Class)
    (:VideoGame — rdfs:subClassOf — :GameResource)
    (:GameRelease — rdfs:subClassOf — :GameResource)
    
    (:VideoGame — rdfs:subClassOf — schema:VideoGame)
    (:Organization — rdfs:subClassOf — schema:Organization)
    (:Review — rdfs:subClassOf — schema:Review)
    (:Genre — rdfs:subClassOf — skos:Concept)
    
    (:title — rdfs:subPropertyOf — dcterms:title)
    (:identifier — rdfs:subPropertyOf — dcterms:identifier)
    (:externalIdentifier — rdfs:subPropertyOf — dcterms:identifier)
    (:releaseDate — rdfs:subPropertyOf — dcterms:issued)
    (:historicalDate — rdfs:subPropertyOf — dcterms:date)
    (:derivedFrom — rdfs:subPropertyOf — prov:wasDerivedFrom)
    
    (:releaseOf — rdfs:domain — :GameRelease)
    (:releaseOf — rdfs:range — :VideoGame)
    (:availableOnPlatform — rdfs:domain — :GameRelease)
    (:availableOnPlatform — rdfs:range — :Platform)
    (:hasGenre — rdfs:domain — :VideoGame)
    (:hasGenre — rdfs:range — :Genre)
    
    (?mediaFormat — rdf:type — :MediaFormat)
    (?distributionMethod — rdf:type — :DistributionMethod)
    (?extension — rdf:type — :GameExtension)
    (?inputDevice — rdf:type — :InputDevice)
    (?outputDevice — rdf:type — :OutputDevice)
    (?displayTechnology — rdf:type — :DisplayTechnology)
    (?feedbackCapability — rdf:type — :FeedbackCapability)
    (?gameMode — rdf:type — :GameMode)
    (?connectivityMode — rdf:type — :MultiplayerConnectivityMode)
    (?multiplayerStyle — rdf:type — :MultiplayerStyle)
    (?character — rdf:type — :Character)
    (?engine — rdf:type — :GameEngine)
    (?model — rdf:type — :MonetizationModel)
    (?rating — rdf:type — :ContentRating)
    (?ratingSystem — rdf:type — :RatingSystem)
    (?review — rdf:type — :Review)
    (?region — rdf:type — :Region)
    (?period — rdf:type — :HistoricalPeriod)
    (?competitiveContext — rdf:type — :CompetitiveContext)
    
    (?release — :distributedOnMediaFormat — ?mediaFormat)
    (?release — :installedFromMediaFormat — ?mediaFormat)
    (?release — :availableInRegion — ?region)
    
    (?gameOrRelease — :hasParticipatingOrganization — ?organization)
    (:developedBy — rdfs:subPropertyOf — :hasParticipatingOrganization)
    (:publishedBy — rdfs:subPropertyOf — :hasParticipatingOrganization)
    (:distributedBy — rdfs:subPropertyOf — :hasParticipatingOrganization)
    
    (?gameOrRelease — prov:qualifiedAssociation — ?association)
    (?association — rdf:type — prov:Association)
    (?association — prov:agent — ?organization)
    (?association — prov:hadRole — ?role)
    (?role — rdf:type — prov:Role)
    (:DeveloperRole — rdf:type — prov:Role)
    (:PublisherRole — rdf:type — prov:Role)
    (:DistributorRole — rdf:type — prov:Role)
    
    (:ProvenanceRecord — rdfs:subClassOf — prov:Entity)
    (:hasProvenanceRecord — rdfs:range — :ProvenanceRecord)
    (?provenanceRecord — rdf:type — :ProvenanceRecord)
    (?provenanceRecord — prov:wasDerivedFrom — ?source)
    (?provenanceRecord — prov:wasAttributedTo — ?organization)
    (?provenanceRecord — prov:generatedAtTime — ?generatedAtTime)
    
    (?preferredLabel — rdf:type — skosxl:Label)
    (?alternativeLabel — rdf:type — skosxl:Label)
    
    (?release — :hasReleaseWindow — ?releaseWindow)
    (?releaseWindow — rdf:type — time:Interval)
    (?releaseWindow — time:hasBeginning — ?releaseStart)
    (?releaseWindow — time:hasEnd — ?releaseEnd)
    (?releaseStart — rdf:type — time:Instant)
    (?releaseEnd — rdf:type — time:Instant)
    (?releaseStart — time:inXSDDate — ?startDate)
    (?releaseEnd — time:inXSDDate — ?endDate)
    
    (?game — :partOfSeries — ?series)
    (?series — rdf:type — :VideoGameSeries)
    (:partOfSeries — rdfs:subPropertyOf — dcterms:isPartOf)
    
    (:Gamepad — rdfs:subClassOf — :GameController)
    (:Joystick — rdfs:subClassOf — :GameController)
    (:RacingWheel — rdfs:subClassOf — :GameController)
    (:LightGun — rdfs:subClassOf — :GameController)
    (:DancePad — rdfs:subClassOf — :GameController)
    (:VRController — rdfs:subClassOf — :GameController)
    (:GameExtension — rdfs:subClassOf — :GameResource)
    (:Mod — rdfs:subClassOf — :GameExtension)
    (?mod — rdf:type — :Mod)
    (?mod — :modifiesResource — ?gameOrRelease)
    (:modifiesResource — rdfs:domain — :Mod)
    (:modifiesResource — rdfs:range — :GameResource)
    (:extendsResource — rdfs:domain — :GameExtension)
    (:extendsResource — rdfs:range — :GameResource)
    (?extension — dcterms:creator — ?creator)
    (?creator — rdf:type — prov:Agent)
    (:Organization — rdfs:subClassOf — prov:Agent)
    
    (?session — :hasPlayer — ?player)
    (:hasPlayer — rdfs:domain — :GameplaySession)
    (:hasPlayer — rdfs:range — prov:Agent)
    
    (?gameOrRelease — :requiresOnlineService — ?service)
    (:requiresOnlineService — rdfs:subPropertyOf — :accessibleViaOnlineService)
    (:requiresOnlineService — rdfs:domain — :GameResource)
    (:requiresOnlineService — rdfs:range — :OnlineService)
    (?service — :operatedBy — ?operator)
    (:operatedBy — rdfs:domain — :OnlineService)
    (:operatedBy — rdfs:range — prov:Agent)
    
    (:RatingAuthority — rdfs:subClassOf — :Organization)
    (?ratingAuthority — rdf:type — :RatingAuthority)
    (?ratingSystem — :administeredBy — ?ratingAuthority)
    (:administeredBy — rdfs:domain — :RatingSystem)
    (:administeredBy — rdfs:range — :RatingAuthority)
    (?ratingSystem — :appliesInRegion — ?region)
    (:appliesInRegion — rdfs:domain — :RatingSystem)
    (:appliesInRegion — rdfs:range — :Region)
    (?rating — :validInRegion — ?region)
    (:validInRegion — rdfs:domain — :ContentRating)
    (:validInRegion — rdfs:range — :Region)
    (:ContentDescriptor — rdfs:subClassOf — skos:Concept)
    (:AgeCategory — rdfs:subClassOf — skos:Concept)
    (?descriptor — rdf:type — :ContentDescriptor)
    (?ageCategory — rdf:type — :AgeCategory)
    
    (?competitiveContext — :featuresGame — ?game)
    (:featuresGame — rdfs:domain — :CompetitiveContext)
    (:featuresGame — rdfs:range — :VideoGame)
    (?competitiveContext — :featuresGameRelease — ?release)
    (:featuresGameRelease — rdfs:domain — :CompetitiveContext)
    (:featuresGameRelease — rdfs:range — :GameRelease)
    (?competitiveContext — :hasCompetitor — ?competitor)
    (:hasCompetitor — rdfs:domain — :CompetitiveContext)
    (:hasCompetitor — rdfs:range — prov:Agent)
    (?competitiveContext — :organizedBy — ?organizer)
    (:organizedBy — rdfs:domain — :CompetitiveContext)
    (:organizedBy — rdfs:range — prov:Agent)
    (:EsportsEvent — rdfs:subClassOf — prov:Activity)
    
    (:derivedFrom — rdfs:domain — :GameResource)
    (:derivedFrom — rdfs:range — :GameResource)
    
    (?concept — skos:scopeNote — ?scopeNote)
    (?concept — skos:historyNote — ?historyNote)
    ```
    
- Step 08 — Turtle Serialization
    
    ```
    Now serialize the complete conceptual model developed in the previous steps into Turtle syntax.
    
    Consider the full conceptual model below, not just a snippet:
    ###start_conceptual_model###
    {previous_step_content}
    ###end_conceptual_model###
    
    Follow these instructions:
    - Convert each subject–relation–object triple into valid RDF/Turtle syntax.
    - Use consistent prefixes and namespaces.
    - Define all classes, object properties, and data properties clearly.
    - Include rdfs:subClassOf and rdf:type statements where appropriate.
    - Preserve all semantically justified axioms from the conceptual model.
    - Provide human-readable labels and useful descriptions where appropriate.
    - Ensure there are no syntax errors.
    - Ensure domains, ranges, hierarchy, and property semantics are logically coherent.
    - Serialize the whole conceptual model, not just a snippet.
    
    Output the complete Turtle ontology.
    ```
    
- Step 08 output
    
    ```markdown
    @prefix : <https://example.org/video-game-ontology#> .
    @prefix dcterms: <http://purl.org/dc/terms/> .
    @prefix owl: <http://www.w3.org/2002/07/owl#> .
    @prefix prov: <http://www.w3.org/ns/prov#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    @prefix schema: <https://schema.org/> .
    @prefix skos: <http://www.w3.org/2004/02/skos/core#> .
    @prefix skosxl: <http://www.w3.org/2008/05/skos-xl#> .
    @prefix time: <http://www.w3.org/2006/time#> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    
    <https://example.org/video-game-ontology>
        a owl:Ontology ;
        dcterms:title "Video Game Ontology"@en ;
        dcterms:description "An ontology for video games, releases, platforms, media, extensions, devices, genres, mechanics, multiplayer modes, organizations, engines, monetization, ratings, reviews, historical context, competitive contexts, provenance, external links, release windows, series, and gameplay sessions. It reuses Dublin Core Terms, PROV-O, SKOS, SKOS-XL, OWL-Time, Schema.org, RDF, RDFS, and OWL."@en ;
        rdfs:comment "SKOS and SKOS-XL are used for concepts and labels; PROV-O is used for derivation, qualified associations, agents, roles, and provenance records; OWL-Time is used for release windows; external alignment may use owl:sameAs and skos:exactMatch."@en .
    
    #################################################################
    # Classes
    #################################################################
    
    :AgeCategory a owl:Class ;
        rdfs:label "Age Category"@en ;
        rdfs:comment "A SKOS concept representing an age category in a rating system."@en ;
        rdfs:subClassOf skos:Concept .
    
    :ArcadeSystem a owl:Class ;
        rdfs:label "Arcade System"@en ;
        rdfs:comment "A type of platform."@en ;
        rdfs:subClassOf :Platform .
    
    :ArtGame a owl:Class ;
        rdfs:label "Art Game"@en ;
        rdfs:comment "A type of video game."@en ;
        rdfs:subClassOf :VideoGame .
    
    :AudioFeedbackCapability a owl:Class ;
        rdfs:label "Audio Feedback Capability"@en ;
        rdfs:comment "A type of feedback capability."@en ;
        rdfs:subClassOf :FeedbackCapability .
    
    :BrowserPlatform a owl:Class ;
        rdfs:label "Browser Platform"@en ;
        rdfs:comment "A type of platform."@en ;
        rdfs:subClassOf :Platform .
    
    :BuiltInScreen a owl:Class ;
        rdfs:label "Built In Screen"@en ;
        rdfs:comment "A type of display device."@en ;
        rdfs:subClassOf :DisplayDevice .
    
    :CDROM a owl:Class ;
        rdfs:label "CD-ROM"@en ;
        rdfs:comment "A type of optical disc."@en ;
        rdfs:subClassOf :OpticalDisc .
    
    :CRTDisplay a owl:Class ;
        rdfs:label "CRT display"@en ;
        rdfs:comment "A type of display device."@en ;
        rdfs:subClassOf :DisplayDevice .
    
    :CasualGame a owl:Class ;
        rdfs:label "Casual Game"@en ;
        rdfs:comment "A type of video game."@en ;
        rdfs:subClassOf :VideoGame .
    
    :Character a owl:Class ;
        rdfs:label "Character"@en ;
        rdfs:comment "A character appearing in a video game."@en .
    
    :CloudGamingPlatform a owl:Class ;
        rdfs:label "Cloud Gaming Platform"@en ;
        rdfs:comment "A type of platform."@en ;
        rdfs:subClassOf :Platform .
    
    :CloudGamingService a owl:Class ;
        rdfs:label "Cloud Gaming Service"@en ;
        rdfs:comment "A type of online service."@en ;
        rdfs:subClassOf :OnlineService .
    
    :CompetitiveContext a owl:Class ;
        rdfs:label "Competitive Context"@en ;
        rdfs:comment "A competitive context in which a game or release may participate."@en .
    
    :ComputerMonitor a owl:Class ;
        rdfs:label "Computer Monitor"@en ;
        rdfs:comment "A type of display device."@en ;
        rdfs:subClassOf :DisplayDevice .
    
    :ContentDescriptor a owl:Class ;
        rdfs:label "Content Descriptor"@en ;
        rdfs:comment "A SKOS concept describing content reflected in a content rating."@en ;
        rdfs:subClassOf skos:Concept .
    
    :ContentRating a owl:Class ;
        rdfs:label "Content Rating"@en ;
        rdfs:comment "A content rating assigned to a game release."@en .
    
    :CoreGame a owl:Class ;
        rdfs:label "Core Game"@en ;
        rdfs:comment "A type of video game."@en ;
        rdfs:subClassOf :VideoGame .
    
    :DVD a owl:Class ;
        rdfs:label "DVD"@en ;
        rdfs:comment "A type of optical disc."@en ;
        rdfs:subClassOf :OpticalDisc .
    
    :DancePad a owl:Class ;
        rdfs:label "Dance Pad"@en ;
        rdfs:comment "A class that is a subtype of input device and game controller."@en ;
        rdfs:subClassOf :InputDevice, :GameController .
    
    :DigitalCamera a owl:Class ;
        rdfs:label "Digital Camera"@en ;
        rdfs:comment "A type of input device."@en ;
        rdfs:subClassOf :InputDevice .
    
    :DigitalMediaFormat a owl:Class ;
        rdfs:label "Digital Media Format"@en ;
        rdfs:comment "A type of media format."@en ;
        rdfs:subClassOf :MediaFormat .
    
    :DisplayDevice a owl:Class ;
        rdfs:label "Display Device"@en ;
        rdfs:comment "A type of output device."@en ;
        rdfs:subClassOf :OutputDevice .
    
    :DisplayTechnology a owl:Class ;
        rdfs:label "Display Technology"@en ;
        rdfs:comment "A display technology supported by a game or release."@en .
    
    :DistributionMethod a owl:Class ;
        rdfs:label "Distribution Method"@en ;
        rdfs:comment "A method by which a game release is distributed."@en .
    
    :DownloadableContent a owl:Class ;
        rdfs:label "Downloadable Content"@en ;
        rdfs:comment "A type of game extension."@en ;
        rdfs:subClassOf :GameExtension .
    
    :EducationalGame a owl:Class ;
        rdfs:label "Educational Game"@en ;
        rdfs:comment "A type of serious game."@en ;
        rdfs:subClassOf :SeriousGame .
    
    :EsportsEvent a owl:Class ;
        rdfs:label "Esports Event"@en ;
        rdfs:comment "A class that is a subtype of competitive context and prov:Activity."@en ;
        rdfs:subClassOf :CompetitiveContext, prov:Activity .
    
    :ExpansionPack a owl:Class ;
        rdfs:label "Expansion Pack"@en ;
        rdfs:comment "A type of game extension."@en ;
        rdfs:subClassOf :GameExtension .
    
    :FeedbackCapability a owl:Class ;
        rdfs:label "Feedback Capability"@en ;
        rdfs:comment "A visual, audio, haptic, or other feedback capability."@en .
    
    :FlashMemoryCard a owl:Class ;
        rdfs:label "Flash Memory Card"@en ;
        rdfs:comment "A type of physical media format."@en ;
        rdfs:subClassOf :PhysicalMediaFormat .
    
    :FloppyDisk a owl:Class ;
        rdfs:label "Floppy Disk"@en ;
        rdfs:comment "A type of physical media format."@en ;
        rdfs:subClassOf :PhysicalMediaFormat .
    
    :GameController a owl:Class ;
        rdfs:label "Game Controller"@en ;
        rdfs:comment "A type of input device."@en ;
        rdfs:subClassOf :InputDevice .
    
    :GameEngine a owl:Class ;
        rdfs:label "Game Engine"@en ;
        rdfs:comment "A game engine used to develop a game or release."@en .
    
    :GameExtension a owl:Class ;
        rdfs:label "Game Extension"@en ;
        rdfs:comment "A game resource that extends another game or release."@en ;
        rdfs:subClassOf :GameResource .
    
    :GameMode a owl:Class ;
        rdfs:label "Game Mode"@en ;
        rdfs:comment "A mode of play supported by a game or release."@en .
    
    :GameRelease a owl:Class ;
        rdfs:label "Game Release"@en ;
        rdfs:comment "A particular release, edition, or version of a video game."@en ;
        rdfs:subClassOf :GameResource .
    
    :GameResource a owl:Class ;
        rdfs:label "Game Resource"@en ;
        rdfs:comment "A resource in the video-game domain, including video games, releases, and extensions."@en .
    
    :Gamepad a owl:Class ;
        rdfs:label "Gamepad"@en ;
        rdfs:comment "A class that is a subtype of input device and game controller."@en ;
        rdfs:subClassOf :InputDevice, :GameController .
    
    :GameplayMechanic a owl:Class ;
        rdfs:label "Gameplay Mechanic"@en ;
        rdfs:comment "A gameplay rule, system, or mechanic associated with a video game."@en .
    
    :GameplaySession a owl:Class ;
        rdfs:label "Gameplay Session"@en ;
        rdfs:comment "An occurrence of playing a particular game release."@en .
    
    :Genre a owl:Class ;
        rdfs:label "Genre"@en ;
        rdfs:comment "A SKOS concept used to classify a video game by genre."@en ;
        rdfs:subClassOf skos:Concept .
    
    :HandheldConsole a owl:Class ;
        rdfs:label "Handheld Console"@en ;
        rdfs:comment "A type of platform."@en ;
        rdfs:subClassOf :Platform .
    
    :HapticFeedbackCapability a owl:Class ;
        rdfs:label "Haptic Feedback Capability"@en ;
        rdfs:comment "A type of feedback capability."@en ;
        rdfs:subClassOf :FeedbackCapability .
    
    :Headphones a owl:Class ;
        rdfs:label "Headphones"@en ;
        rdfs:comment "A type of output device."@en ;
        rdfs:subClassOf :OutputDevice .
    
    :HistoricalPeriod a owl:Class ;
        rdfs:label "Historical Period"@en ;
        rdfs:comment "A historical period used to contextualize resources or labels."@en .
    
    :HomeConsole a owl:Class ;
        rdfs:label "Home Console"@en ;
        rdfs:comment "A type of platform."@en ;
        rdfs:subClassOf :Platform .
    
    :InputDevice a owl:Class ;
        rdfs:label "Input Device"@en ;
        rdfs:comment "A device used to provide input to a game or gameplay session."@en .
    
    :Joystick a owl:Class ;
        rdfs:label "Joystick"@en ;
        rdfs:comment "A class that is a subtype of input device and game controller."@en ;
        rdfs:subClassOf :InputDevice, :GameController .
    
    :Keyboard a owl:Class ;
        rdfs:label "Keyboard"@en ;
        rdfs:comment "A type of input device."@en ;
        rdfs:subClassOf :InputDevice .
    
    :LCDDisplay a owl:Class ;
        rdfs:label "LCD display"@en ;
        rdfs:comment "A type of display device."@en ;
        rdfs:subClassOf :DisplayDevice .
    
    :LightGun a owl:Class ;
        rdfs:label "Light Gun"@en ;
        rdfs:comment "A class that is a subtype of input device and game controller."@en ;
        rdfs:subClassOf :InputDevice, :GameController .
    
    :MagneticTape a owl:Class ;
        rdfs:label "Magnetic Tape"@en ;
        rdfs:comment "A type of physical media format."@en ;
        rdfs:subClassOf :PhysicalMediaFormat .
    
    :MediaFormat a owl:Class ;
        rdfs:label "Media Format"@en ;
        rdfs:comment "A physical or digital format used to distribute or install a game release."@en .
    
    :Microphone a owl:Class ;
        rdfs:label "Microphone"@en ;
        rdfs:comment "A type of input device."@en ;
        rdfs:subClassOf :InputDevice .
    
    :MobilePlatform a owl:Class ;
        rdfs:label "Mobile Platform"@en ;
        rdfs:comment "A type of platform."@en ;
        rdfs:subClassOf :Platform .
    
    :Mod a owl:Class ;
        rdfs:label "Mod"@en ;
        rdfs:comment "A type of game extension."@en ;
        rdfs:subClassOf :GameExtension .
    
    :MonetizationModel a owl:Class ;
        rdfs:label "Monetization Model"@en ;
        rdfs:comment "A model describing how a game or release is monetized."@en .
    
    :MotionSensor a owl:Class ;
        rdfs:label "Motion Sensor"@en ;
        rdfs:comment "A type of input device."@en ;
        rdfs:subClassOf :InputDevice .
    
    :Mouse a owl:Class ;
        rdfs:label "Mouse"@en ;
        rdfs:comment "A type of input device."@en ;
        rdfs:subClassOf :InputDevice .
    
    :MultiplayerConnectivityMode a owl:Class ;
        rdfs:label "Multiplayer Connectivity Mode"@en ;
        rdfs:comment "A connectivity mode used for multiplayer play."@en .
    
    :MultiplayerStyle a owl:Class ;
        rdfs:label "Multiplayer Style"@en ;
        rdfs:comment "A style or structure of multiplayer play."@en .
    
    :NonPlayerCharacter a owl:Class ;
        rdfs:label "Non Player Character"@en ;
        rdfs:comment "A type of character."@en ;
        rdfs:subClassOf :Character .
    
    :OnlineService a owl:Class ;
        rdfs:label "Online Service"@en ;
        rdfs:comment "An online service through which a game or release may be accessed or required."@en .
    
    :OpticalDisc a owl:Class ;
        rdfs:label "Optical Disc"@en ;
        rdfs:comment "A type of physical media format."@en ;
        rdfs:subClassOf :PhysicalMediaFormat .
    
    :Organization a owl:Class ;
        rdfs:label "Organization"@en ;
        rdfs:comment "An organization participating in the video-game ecosystem."@en ;
        rdfs:subClassOf schema:Organization, prov:Agent .
    
    :OutputDevice a owl:Class ;
        rdfs:label "Output Device"@en ;
        rdfs:comment "A device used to present game output."@en .
    
    :PersonalComputerPlatform a owl:Class ;
        rdfs:label "Personal Computer Platform"@en ;
        rdfs:comment "A type of platform."@en ;
        rdfs:subClassOf :Platform .
    
    :PhysicalMediaFormat a owl:Class ;
        rdfs:label "Physical Media Format"@en ;
        rdfs:comment "A type of media format."@en ;
        rdfs:subClassOf :MediaFormat .
    
    :Platform a owl:Class ;
        rdfs:label "Platform"@en ;
        rdfs:comment "A hardware, software, browser, mobile, cloud, or virtual-reality platform on which games may run."@en .
    
    :PlayerCharacter a owl:Class ;
        rdfs:label "Player Character"@en ;
        rdfs:comment "A type of character."@en ;
        rdfs:subClassOf :Character .
    
    :Projector a owl:Class ;
        rdfs:label "Projector"@en ;
        rdfs:comment "A type of display device."@en ;
        rdfs:subClassOf :DisplayDevice .
    
    :ProvenanceRecord a owl:Class ;
        rdfs:label "Provenance Record"@en ;
        rdfs:comment "A PROV entity that records provenance information for a resource."@en ;
        rdfs:subClassOf prov:Entity .
    
    :ROMCartridge a owl:Class ;
        rdfs:label "ROM cartridge"@en ;
        rdfs:comment "A type of physical media format."@en ;
        rdfs:subClassOf :PhysicalMediaFormat .
    
    :RacingWheel a owl:Class ;
        rdfs:label "Racing Wheel"@en ;
        rdfs:comment "A class that is a subtype of input device and game controller."@en ;
        rdfs:subClassOf :InputDevice, :GameController .
    
    :RatingAuthority a owl:Class ;
        rdfs:label "Rating Authority"@en ;
        rdfs:comment "An organization that administers a content-rating system."@en ;
        rdfs:subClassOf :Organization .
    
    :RatingSystem a owl:Class ;
        rdfs:label "Rating System"@en ;
        rdfs:comment "A system that issues or administers content ratings."@en .
    
    :Region a owl:Class ;
        rdfs:label "Region"@en ;
        rdfs:comment "A geographic or market region relevant to releases, labels, ratings, or other resources."@en .
    
    :Review a owl:Class ;
        rdfs:label "Review"@en ;
        rdfs:comment "A review of a game release."@en ;
        rdfs:subClassOf schema:Review .
    
    :SeriousGame a owl:Class ;
        rdfs:label "Serious Game"@en ;
        rdfs:comment "A type of video game."@en ;
        rdfs:subClassOf :VideoGame .
    
    :Speaker a owl:Class ;
        rdfs:label "Speaker"@en ;
        rdfs:comment "A type of output device."@en ;
        rdfs:subClassOf :OutputDevice .
    
    :Touchscreen a owl:Class ;
        rdfs:label "Touchscreen"@en ;
        rdfs:comment "A type of input device."@en ;
        rdfs:subClassOf :InputDevice .
    
    :VRController a owl:Class ;
        rdfs:label "VR controller"@en ;
        rdfs:comment "A class that is a subtype of vr input device and game controller."@en ;
        rdfs:subClassOf :VRInputDevice, :GameController .
    
    :VRHeadset a owl:Class ;
        rdfs:label "VR headset"@en ;
        rdfs:comment "A class that is a subtype of display device and vr output device."@en ;
        rdfs:subClassOf :DisplayDevice, :VROutputDevice .
    
    :VRInputDevice a owl:Class ;
        rdfs:label "VR input device"@en ;
        rdfs:comment "A type of input device."@en ;
        rdfs:subClassOf :InputDevice .
    
    :VROutputDevice a owl:Class ;
        rdfs:label "VR output device"@en ;
        rdfs:comment "A type of output device."@en ;
        rdfs:subClassOf :OutputDevice .
    
    :VideoGame a owl:Class ;
        rdfs:label "Video Game"@en ;
        rdfs:comment "A video game considered as a creative work independent of a particular release."@en ;
        rdfs:subClassOf :GameResource, schema:VideoGame .
    
    :VideoGameSeries a owl:Class ;
        rdfs:label "Video Game Series"@en ;
        rdfs:comment "A series to which a video game belongs."@en .
    
    :VirtualRealityPlatform a owl:Class ;
        rdfs:label "Virtual Reality Platform"@en ;
        rdfs:comment "A type of platform."@en ;
        rdfs:subClassOf :Platform .
    
    :VisualFeedbackCapability a owl:Class ;
        rdfs:label "Visual Feedback Capability"@en ;
        rdfs:comment "A type of feedback capability."@en ;
        rdfs:subClassOf :FeedbackCapability .
    
    :Webcam a owl:Class ;
        rdfs:label "Webcam"@en ;
        rdfs:comment "A type of input device."@en ;
        rdfs:subClassOf :InputDevice .
    
    #################################################################
    # Object properties
    #################################################################
    
    :accessibleViaOnlineService a owl:ObjectProperty ;
        rdfs:label "accessible Via Online Service"@en ;
        rdfs:comment "Relates a video game or game release to online service via the accessible Via Online Service relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :OnlineService .
    
    :administeredBy a owl:ObjectProperty ;
        rdfs:label "administered By"@en ;
        rdfs:comment "Relates rating system to rating authority via the administered By relation."@en ;
        rdfs:domain :RatingSystem ;
        rdfs:range :RatingAuthority .
    
    :appliesInRegion a owl:ObjectProperty ;
        rdfs:label "applies In Region"@en ;
        rdfs:comment "Relates rating system to region via the applies In Region relation."@en ;
        rdfs:domain :RatingSystem ;
        rdfs:range :Region .
    
    :associatedWithGame a owl:ObjectProperty ;
        rdfs:label "associated With Game"@en ;
        rdfs:comment "Relates a resource to video game via the associated With Game relation."@en ;
        rdfs:domain rdfs:Resource ;
        rdfs:range :VideoGame .
    
    :associatedWithHistoricalPeriod a owl:ObjectProperty ;
        rdfs:label "associated With Historical Period"@en ;
        rdfs:comment "Relates a resource to historical period via the associated With Historical Period relation."@en ;
        rdfs:domain rdfs:Resource ;
        rdfs:range :HistoricalPeriod .
    
    :associatedWithRegion a owl:ObjectProperty ;
        rdfs:label "associated With Region"@en ;
        rdfs:comment "Relates a resource to region via the associated With Region relation."@en ;
        rdfs:domain rdfs:Resource ;
        rdfs:range :Region .
    
    :availableInRegion a owl:ObjectProperty ;
        rdfs:label "available In Region"@en ;
        rdfs:comment "Relates game release to region via the available In Region relation."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range :Region .
    
    :availableOnPlatform a owl:ObjectProperty ;
        rdfs:label "available On Platform"@en ;
        rdfs:comment "Links a game release to a platform on which it is available."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range :Platform .
    
    :backwardCompatibleWith a owl:ObjectProperty ;
        rdfs:label "backward Compatible With"@en ;
        rdfs:comment "Relates platform to platform via the backward Compatible With relation."@en ;
        rdfs:domain :Platform ;
        rdfs:range :Platform .
    
    :conversionOf a owl:ObjectProperty ;
        rdfs:label "conversion Of"@en ;
        rdfs:comment "Relates a game resource to the earlier game resource of which it is a conversion."@en ;
        rdfs:domain :GameResource ;
        rdfs:range :GameResource ;
        rdfs:subPropertyOf :derivedFrom .
    
    :derivedFrom a owl:ObjectProperty ;
        rdfs:label "derived From"@en ;
        rdfs:comment "Relates a game resource to an earlier game resource from which it is derived."@en ;
        rdfs:domain :GameResource ;
        rdfs:range :GameResource ;
        rdfs:subPropertyOf prov:wasDerivedFrom .
    
    :developedBy a owl:ObjectProperty ;
        rdfs:label "developed By"@en ;
        rdfs:comment "Relates a video game or game release to organization via the developed By relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :Organization ;
        rdfs:subPropertyOf :hasParticipatingOrganization .
    
    :developedWithEngine a owl:ObjectProperty ;
        rdfs:label "developed With Engine"@en ;
        rdfs:comment "Relates a video game or game release to game engine via the developed With Engine relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :GameEngine .
    
    :distributedBy a owl:ObjectProperty ;
        rdfs:label "distributed By"@en ;
        rdfs:comment "Relates a video game or game release to organization via the distributed By relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :Organization ;
        rdfs:subPropertyOf :hasParticipatingOrganization .
    
    :distributedOnMediaFormat a owl:ObjectProperty ;
        rdfs:label "distributed On Media Format"@en ;
        rdfs:comment "Relates game release to media format via the distributed On Media Format relation."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range :MediaFormat ;
        rdfs:subPropertyOf :usesMediaFormat .
    
    :distributedVia a owl:ObjectProperty ;
        rdfs:label "distributed Via"@en ;
        rdfs:comment "Relates game release to distribution method via the distributed Via relation."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range :DistributionMethod .
    
    :emulatableOnPlatform a owl:ObjectProperty ;
        rdfs:label "emulatable On Platform"@en ;
        rdfs:comment "Relates a video game or game release to platform via the emulatable On Platform relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :Platform .
    
    :engineSupportsPlatform a owl:ObjectProperty ;
        rdfs:label "engine Supports Platform"@en ;
        rdfs:comment "Relates game engine to platform via the engine Supports Platform relation."@en ;
        rdfs:domain :GameEngine ;
        rdfs:range :Platform .
    
    :exclusiveToPlatform a owl:ObjectProperty ;
        rdfs:label "exclusive To Platform"@en ;
        rdfs:comment "Indicates that a game release is exclusive to a particular platform."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range :Platform ;
        rdfs:subPropertyOf :availableOnPlatform .
    
    :exclusiveToPlatformHolder a owl:ObjectProperty ;
        rdfs:label "exclusive To Platform Holder"@en ;
        rdfs:comment "Links a game release to the organization holding its platform exclusivity."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range :Organization .
    
    :extendsResource a owl:ObjectProperty ;
        rdfs:label "extends Resource"@en ;
        rdfs:comment "Relates game extension to game resource via the extends Resource relation."@en ;
        rdfs:domain :GameExtension ;
        rdfs:range :GameResource .
    
    :externalResourceLink a owl:ObjectProperty ;
        rdfs:label "external Resource Link"@en ;
        rdfs:comment "Links a resource to an external resource; owl:sameAs and skos:exactMatch may additionally express stronger identity or matching semantics."@en ;
        rdfs:domain rdfs:Resource ;
        rdfs:range rdfs:Resource .
    
    :featuresGame a owl:ObjectProperty ;
        rdfs:label "features Game"@en ;
        rdfs:comment "Relates competitive context to video game via the features Game relation."@en ;
        rdfs:domain :CompetitiveContext ;
        rdfs:range :VideoGame .
    
    :featuresGameRelease a owl:ObjectProperty ;
        rdfs:label "features Game Release"@en ;
        rdfs:comment "Relates competitive context to game release via the features Game Release relation."@en ;
        rdfs:domain :CompetitiveContext ;
        rdfs:range :GameRelease .
    
    :hasAgeCategory a owl:ObjectProperty ;
        rdfs:label "has Age Category"@en ;
        rdfs:comment "Relates content rating to age category via the has Age Category relation."@en ;
        rdfs:domain :ContentRating ;
        rdfs:range :AgeCategory .
    
    :hasCharacter a owl:ObjectProperty ;
        rdfs:label "has Character"@en ;
        rdfs:comment "Relates video game to character via the has Character relation."@en ;
        rdfs:domain :VideoGame ;
        rdfs:range :Character .
    
    :hasCompetitor a owl:ObjectProperty ;
        rdfs:label "has Competitor"@en ;
        rdfs:comment "Relates competitive context to prov:Agent via the has Competitor relation."@en ;
        rdfs:domain :CompetitiveContext ;
        rdfs:range prov:Agent .
    
    :hasContentDescriptor a owl:ObjectProperty ;
        rdfs:label "has Content Descriptor"@en ;
        rdfs:comment "Relates content rating to content descriptor via the has Content Descriptor relation."@en ;
        rdfs:domain :ContentRating ;
        rdfs:range :ContentDescriptor .
    
    :hasContentRating a owl:ObjectProperty ;
        rdfs:label "has Content Rating"@en ;
        rdfs:comment "Relates game release to content rating via the has Content Rating relation."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range :ContentRating .
    
    :hasGameMode a owl:ObjectProperty ;
        rdfs:label "has Game Mode"@en ;
        rdfs:comment "Relates a video game or game release to game mode via the has Game Mode relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :GameMode .
    
    :hasGameplayMechanic a owl:ObjectProperty ;
        rdfs:label "has Gameplay Mechanic"@en ;
        rdfs:comment "Relates video game to gameplay mechanic via the has Gameplay Mechanic relation."@en ;
        rdfs:domain :VideoGame ;
        rdfs:range :GameplayMechanic .
    
    :hasGenre a owl:ObjectProperty ;
        rdfs:label "has Genre"@en ;
        rdfs:comment "Relates video game to genre via the has Genre relation."@en ;
        rdfs:domain :VideoGame ;
        rdfs:range :Genre .
    
    :hasMonetizationModel a owl:ObjectProperty ;
        rdfs:label "has Monetization Model"@en ;
        rdfs:comment "Relates a video game or game release to monetization model via the has Monetization Model relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :MonetizationModel .
    
    :hasParticipatingOrganization a owl:ObjectProperty ;
        rdfs:label "has Participating Organization"@en ;
        rdfs:comment "Links a video game or release to an organization participating in its development, publication, or distribution."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :Organization .
    
    :hasPlatformHolder a owl:ObjectProperty ;
        rdfs:label "has Platform Holder"@en ;
        rdfs:comment "Relates platform to organization via the has Platform Holder relation."@en ;
        rdfs:domain :Platform ;
        rdfs:range :Organization .
    
    :hasPlayer a owl:ObjectProperty ;
        rdfs:label "has Player"@en ;
        rdfs:comment "Relates gameplay session to prov:Agent via the has Player relation."@en ;
        rdfs:domain :GameplaySession ;
        rdfs:range prov:Agent .
    
    :hasProvenanceRecord a owl:ObjectProperty ;
        rdfs:label "has Provenance Record"@en ;
        rdfs:comment "Links a resource to a provenance record represented as a PROV entity."@en ;
        rdfs:domain rdfs:Resource ;
        rdfs:range :ProvenanceRecord .
    
    :hasReleaseWindow a owl:ObjectProperty ;
        rdfs:label "has Release Window"@en ;
        rdfs:comment "Links a game release to an OWL-Time interval representing its release window; interval boundaries may use time:hasBeginning, time:hasEnd, and time:inXSDDate."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range time:Interval .
    
    :influencedBy a owl:ObjectProperty ;
        rdfs:label "influenced By"@en ;
        rdfs:comment "Relates a resource to a resource via the influenced By relation."@en ;
        rdfs:domain rdfs:Resource ;
        rdfs:range rdfs:Resource .
    
    :installedFromMediaFormat a owl:ObjectProperty ;
        rdfs:label "installed From Media Format"@en ;
        rdfs:comment "Relates game release to media format via the installed From Media Format relation."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range :MediaFormat ;
        rdfs:subPropertyOf :usesMediaFormat .
    
    :intendedForPlatform a owl:ObjectProperty ;
        rdfs:label "intended For Platform"@en ;
        rdfs:comment "Relates a video game or game release to platform via the intended For Platform relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :Platform .
    
    :issuedByRatingSystem a owl:ObjectProperty ;
        rdfs:label "issued By Rating System"@en ;
        rdfs:comment "Relates content rating to rating system via the issued By Rating System relation."@en ;
        rdfs:domain :ContentRating ;
        rdfs:range :RatingSystem .
    
    :manufacturedBy a owl:ObjectProperty ;
        rdfs:label "manufactured By"@en ;
        rdfs:comment "Relates platform to organization via the manufactured By relation."@en ;
        rdfs:domain :Platform ;
        rdfs:range :Organization .
    
    :modifiesResource a owl:ObjectProperty ;
        rdfs:label "modifies Resource"@en ;
        rdfs:comment "Relates mod to game resource via the modifies Resource relation."@en ;
        rdfs:domain :Mod ;
        rdfs:range :GameResource .
    
    :operatedBy a owl:ObjectProperty ;
        rdfs:label "operated By"@en ;
        rdfs:comment "Relates online service to prov:Agent via the operated By relation."@en ;
        rdfs:domain :OnlineService ;
        rdfs:range prov:Agent .
    
    :optionallySupportsInputDevice a owl:ObjectProperty ;
        rdfs:label "optionally Supports Input Device"@en ;
        rdfs:comment "Relates game release to input device via the optionally Supports Input Device relation."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range :InputDevice ;
        rdfs:subPropertyOf :supportsInputDevice .
    
    :organizedBy a owl:ObjectProperty ;
        rdfs:label "organized By"@en ;
        rdfs:comment "Relates competitive context to prov:Agent via the organized By relation."@en ;
        rdfs:domain :CompetitiveContext ;
        rdfs:range prov:Agent .
    
    :ownedBy a owl:ObjectProperty ;
        rdfs:label "owned By"@en ;
        rdfs:comment "Relates platform to organization via the owned By relation."@en ;
        rdfs:domain :Platform ;
        rdfs:range :Organization .
    
    :partOfSeries a owl:ObjectProperty ;
        rdfs:label "part Of Series"@en ;
        rdfs:comment "Links a video game to the video-game series of which it is part."@en ;
        rdfs:domain :VideoGame ;
        rdfs:range :VideoGameSeries ;
        rdfs:subPropertyOf dcterms:isPartOf .
    
    :participatesInCompetitiveContext a owl:ObjectProperty ;
        rdfs:label "participates In Competitive Context"@en ;
        rdfs:comment "Links a video game or release to a competitive context in which it participates."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :CompetitiveContext .
    
    :portOf a owl:ObjectProperty ;
        rdfs:label "port Of"@en ;
        rdfs:comment "Relates a game resource to the earlier game resource of which it is a port."@en ;
        rdfs:domain :GameResource ;
        rdfs:range :GameResource ;
        rdfs:subPropertyOf :derivedFrom .
    
    :precededBy a owl:ObjectProperty ;
        rdfs:label "preceded By"@en ;
        rdfs:comment "Relates a resource to a resource via the preceded By relation."@en ;
        rdfs:domain rdfs:Resource ;
        rdfs:range rdfs:Resource .
    
    :providesFeedbackCapability a owl:ObjectProperty ;
        rdfs:label "provides Feedback Capability"@en ;
        rdfs:comment "Relates a resource to feedback capability via the provides Feedback Capability relation."@en ;
        rdfs:domain rdfs:Resource ;
        rdfs:range :FeedbackCapability .
    
    :publishedBy a owl:ObjectProperty ;
        rdfs:label "published By"@en ;
        rdfs:comment "Relates a video game or game release to organization via the published By relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :Organization ;
        rdfs:subPropertyOf :hasParticipatingOrganization .
    
    :releaseOf a owl:ObjectProperty ;
        rdfs:label "release Of"@en ;
        rdfs:comment "Links a particular game release to the video game work that it releases."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range :VideoGame .
    
    :remakeOf a owl:ObjectProperty ;
        rdfs:label "remake Of"@en ;
        rdfs:comment "Relates a game resource to the earlier game resource of which it is a remake."@en ;
        rdfs:domain :GameResource ;
        rdfs:range :GameResource ;
        rdfs:subPropertyOf :derivedFrom .
    
    :remasterOf a owl:ObjectProperty ;
        rdfs:label "remaster Of"@en ;
        rdfs:comment "Relates a game resource to the earlier game resource of which it is a remaster."@en ;
        rdfs:domain :GameResource ;
        rdfs:range :GameResource ;
        rdfs:subPropertyOf :derivedFrom .
    
    :requiresInputDevice a owl:ObjectProperty ;
        rdfs:label "requires Input Device"@en ;
        rdfs:comment "Relates game release to input device via the requires Input Device relation."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range :InputDevice ;
        rdfs:subPropertyOf :supportsInputDevice .
    
    :requiresOnlineService a owl:ObjectProperty ;
        rdfs:label "requires Online Service"@en ;
        rdfs:comment "Relates game resource to online service via the requires Online Service relation."@en ;
        rdfs:domain :GameResource ;
        rdfs:range :OnlineService ;
        rdfs:subPropertyOf :accessibleViaOnlineService .
    
    :reviewsRelease a owl:ObjectProperty ;
        rdfs:label "reviews Release"@en ;
        rdfs:comment "Relates review to game release via the reviews Release relation."@en ;
        rdfs:domain :Review ;
        rdfs:range :GameRelease .
    
    :supportsDisplayTechnology a owl:ObjectProperty ;
        rdfs:label "supports Display Technology"@en ;
        rdfs:comment "Relates a video game or game release to display technology via the supports Display Technology relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :DisplayTechnology .
    
    :supportsInputDevice a owl:ObjectProperty ;
        rdfs:label "supports Input Device"@en ;
        rdfs:comment "Relates a video game or game release to input device via the supports Input Device relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :InputDevice .
    
    :supportsMultiplayerConnectivity a owl:ObjectProperty ;
        rdfs:label "supports Multiplayer Connectivity"@en ;
        rdfs:comment "Relates a video game or game release to multiplayer connectivity mode via the supports Multiplayer Connectivity relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :MultiplayerConnectivityMode .
    
    :supportsMultiplayerStyle a owl:ObjectProperty ;
        rdfs:label "supports Multiplayer Style"@en ;
        rdfs:comment "Relates a video game or game release to multiplayer style via the supports Multiplayer Style relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :MultiplayerStyle .
    
    :supportsOutputDevice a owl:ObjectProperty ;
        rdfs:label "supports Output Device"@en ;
        rdfs:comment "Relates a video game or game release to output device via the supports Output Device relation."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range :OutputDevice .
    
    :usedInputDevice a owl:ObjectProperty ;
        rdfs:label "used Input Device"@en ;
        rdfs:comment "Relates gameplay session to input device via the used Input Device relation."@en ;
        rdfs:domain :GameplaySession ;
        rdfs:range :InputDevice .
    
    :usedMicrophoneForInGameCommunication a owl:ObjectProperty ;
        rdfs:label "used Microphone For In Game Communication"@en ;
        rdfs:comment "Relates gameplay session to microphone via the used Microphone For In Game Communication relation."@en ;
        rdfs:domain :GameplaySession ;
        rdfs:range :Microphone ;
        rdfs:subPropertyOf :usedInputDevice .
    
    :usedWebcamForLivestreaming a owl:ObjectProperty ;
        rdfs:label "used Webcam For Livestreaming"@en ;
        rdfs:comment "Relates gameplay session to webcam via the used Webcam For Livestreaming relation."@en ;
        rdfs:domain :GameplaySession ;
        rdfs:range :Webcam ;
        rdfs:subPropertyOf :usedInputDevice .
    
    :usesGameRelease a owl:ObjectProperty ;
        rdfs:label "uses Game Release"@en ;
        rdfs:comment "Relates gameplay session to game release via the uses Game Release relation."@en ;
        rdfs:domain :GameplaySession ;
        rdfs:range :GameRelease .
    
    :usesMediaFormat a owl:ObjectProperty ;
        rdfs:label "uses Media Format"@en ;
        rdfs:comment "Relates game release to media format via the uses Media Format relation."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range :MediaFormat .
    
    :validInRegion a owl:ObjectProperty ;
        rdfs:label "valid In Region"@en ;
        rdfs:comment "Relates content rating to region via the valid In Region relation."@en ;
        rdfs:domain :ContentRating ;
        rdfs:range :Region .
    
    #################################################################
    # Datatype properties
    #################################################################
    
    :externalIdentifier a owl:DatatypeProperty ;
        rdfs:label "external Identifier"@en ;
        rdfs:comment "Records the external Identifier value for a resource; values use xsd:string."@en ;
        rdfs:domain rdfs:Resource ;
        rdfs:range xsd:string ;
        rdfs:subPropertyOf dcterms:identifier .
    
    :historicalDate a owl:DatatypeProperty ;
        rdfs:label "historical Date"@en ;
        rdfs:comment "Records the historical Date value for a resource; values use xsd:date."@en ;
        rdfs:domain rdfs:Resource ;
        rdfs:range xsd:date ;
        rdfs:subPropertyOf dcterms:date .
    
    :identifier a owl:DatatypeProperty ;
        rdfs:label "identifier"@en ;
        rdfs:comment "Records the identifier value for game release; values use xsd:string."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range xsd:string ;
        rdfs:subPropertyOf dcterms:identifier .
    
    :maximumPlayerCount a owl:DatatypeProperty ;
        rdfs:label "maximum Player Count"@en ;
        rdfs:comment "Records the maximum Player Count value for a video game or game release; values use xsd:nonNegativeInteger."@en ;
        rdfs:domain [ a owl:Class ; owl:unionOf ( :VideoGame :GameRelease ) ] ;
        rdfs:range xsd:nonNegativeInteger .
    
    :minimumAge a owl:DatatypeProperty ;
        rdfs:label "minimum Age"@en ;
        rdfs:comment "Records the minimum Age value for content rating; values use xsd:nonNegativeInteger."@en ;
        rdfs:domain :ContentRating ;
        rdfs:range xsd:nonNegativeInteger .
    
    :officiallySupported a owl:DatatypeProperty ;
        rdfs:label "officially Supported"@en ;
        rdfs:comment "Records the officially Supported value for a resource; values use xsd:boolean."@en ;
        rdfs:domain rdfs:Resource ;
        rdfs:range xsd:boolean .
    
    :periodEnd a owl:DatatypeProperty ;
        rdfs:label "period End"@en ;
        rdfs:comment "Records the period End value for historical period; values use xsd:date."@en ;
        rdfs:domain :HistoricalPeriod ;
        rdfs:range xsd:date .
    
    :periodStart a owl:DatatypeProperty ;
        rdfs:label "period Start"@en ;
        rdfs:comment "Records the period Start value for historical period; values use xsd:date."@en ;
        rdfs:domain :HistoricalPeriod ;
        rdfs:range xsd:date .
    
    :ratingCode a owl:DatatypeProperty ;
        rdfs:label "rating Code"@en ;
        rdfs:comment "Records the rating Code value for content rating; values use xsd:string."@en ;
        rdfs:domain :ContentRating ;
        rdfs:range xsd:string .
    
    :releaseDate a owl:DatatypeProperty ;
        rdfs:label "release Date"@en ;
        rdfs:comment "Records the release Date value for game release; values use xsd:date."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range xsd:date ;
        rdfs:subPropertyOf dcterms:issued .
    
    :reviewRatingValue a owl:DatatypeProperty ;
        rdfs:label "review Rating Value"@en ;
        rdfs:comment "Records the review Rating Value value for review; values use xsd:decimal."@en ;
        rdfs:domain :Review ;
        rdfs:range xsd:decimal .
    
    :reviewText a owl:DatatypeProperty ;
        rdfs:label "review Text"@en ;
        rdfs:comment "Records the review Text value for review; values use xsd:string."@en ;
        rdfs:domain :Review ;
        rdfs:range xsd:string .
    
    :sourceVersion a owl:DatatypeProperty ;
        rdfs:label "source Version"@en ;
        rdfs:comment "Records the source Version value for a resource; values use xsd:string."@en ;
        rdfs:domain rdfs:Resource ;
        rdfs:range xsd:string .
    
    :title a owl:DatatypeProperty ;
        rdfs:label "title"@en ;
        rdfs:comment "Records the title value for game release; values use xsd:string."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range xsd:string ;
        rdfs:subPropertyOf dcterms:title .
    
    :userCreated a owl:DatatypeProperty ;
        rdfs:label "user Created"@en ;
        rdfs:comment "Records the user Created value for a resource; values use xsd:boolean."@en ;
        rdfs:domain rdfs:Resource ;
        rdfs:range xsd:boolean .
    
    :version a owl:DatatypeProperty ;
        rdfs:label "version"@en ;
        rdfs:comment "Records the version value for game release; values use xsd:string."@en ;
        rdfs:domain :GameRelease ;
        rdfs:range xsd:string .
    
    #################################################################
    # Named individuals
    #################################################################
    
    :ACB a :RatingSystem ;
        rdfs:label "ACB"@en ;
        rdfs:comment "A named rating system value: ACB."@en .
    
    :Asymmetric a :MultiplayerStyle ;
        rdfs:label "Asymmetric"@en ;
        rdfs:comment "A named multiplayer style value: Asymmetric."@en .
    
    :CERO a :RatingSystem ;
        rdfs:label "CERO"@en ;
        rdfs:comment "A named rating system value: CERO."@en .
    
    :CloudDelivery a :DistributionMethod ;
        rdfs:label "Cloud Delivery"@en ;
        rdfs:comment "A named distribution method value: Cloud Delivery."@en .
    
    :Competitive a :MultiplayerStyle ;
        rdfs:label "Competitive"@en ;
        rdfs:comment "A named multiplayer style value: Competitive."@en .
    
    :Cooperative a :MultiplayerStyle ;
        rdfs:label "Cooperative"@en ;
        rdfs:comment "A named multiplayer style value: Cooperative."@en .
    
    :DeveloperRole a prov:Role ;
        rdfs:label "Developer Role"@en ;
        rdfs:comment "A named prov:Role value used by the ontology: Developer Role."@en .
    
    :DigitalDownload a :DistributionMethod ;
        rdfs:label "Digital Download"@en ;
        rdfs:comment "A named distribution method value: Digital Download."@en .
    
    :DistributorRole a prov:Role ;
        rdfs:label "Distributor Role"@en ;
        rdfs:comment "A named prov:Role value used by the ontology: Distributor Role."@en .
    
    :ESRB a :RatingSystem ;
        rdfs:label "ESRB"@en ;
        rdfs:comment "A named rating system value: ESRB."@en .
    
    :GamesAsAService a :MonetizationModel ;
        rdfs:label "Games as a Service"@en ;
        rdfs:comment "A named monetization model value: Games as a Service."@en .
    
    :InternetOnline a :MultiplayerConnectivityMode ;
        rdfs:label "Internet/online"@en ;
        rdfs:comment "A named multiplayer connectivity mode value: Internet/online."@en .
    
    :LocalNetwork a :MultiplayerConnectivityMode ;
        rdfs:label "Local Network"@en ;
        rdfs:comment "A named multiplayer connectivity mode value: Local Network."@en .
    
    :LocalSameDevice a :MultiplayerConnectivityMode ;
        rdfs:label "Local same-device"@en ;
        rdfs:comment "A named multiplayer connectivity mode value: Local same-device."@en .
    
    :MassivelyMultiplayer a :MultiplayerStyle ;
        rdfs:label "Massively Multiplayer"@en ;
        rdfs:comment "A named multiplayer style value: Massively Multiplayer."@en .
    
    :Multiplayer a :GameMode ;
        rdfs:label "Multiplayer"@en ;
        rdfs:comment "A named game mode value: Multiplayer."@en .
    
    :PEGI a :RatingSystem ;
        rdfs:label "PEGI"@en ;
        rdfs:comment "A named rating system value: PEGI."@en .
    
    :PhysicalMediaDistribution a :DistributionMethod ;
        rdfs:label "Physical Media Distribution"@en ;
        rdfs:comment "A named distribution method value: Physical Media Distribution."@en .
    
    :PublisherRole a prov:Role ;
        rdfs:label "Publisher Role"@en ;
        rdfs:comment "A named prov:Role value used by the ontology: Publisher Role."@en .
    
    :SinglePlayer a :GameMode ;
        rdfs:label "Single Player"@en ;
        rdfs:comment "A named game mode value: Single Player."@en .
    
    :TeamBased a :MultiplayerStyle ;
        rdfs:label "Team Based"@en ;
        rdfs:comment "A named multiplayer style value: Team Based."@en .
    
    :USK a :RatingSystem ;
        rdfs:label "USK"@en ;
        rdfs:comment "A named rating system value: USK."@en .
    
    :ZeroPlayer a :GameMode ;
        rdfs:label "Zero Player"@en ;
        rdfs:comment "A named game mode value: Zero Player."@en .
    
    #################################################################
    # External vocabulary usage notes
    #################################################################
    
    <https://example.org/video-game-ontology>
        rdfs:comment "SKOS concepts may use skos:prefLabel, skos:altLabel, skos:broader, skos:narrower, skos:scopeNote, and skos:historyNote. SKOS-XL labels may use skosxl:prefLabel, skosxl:altLabel, and skosxl:literalForm, with region and historical-period context supplied by :associatedWithRegion and :associatedWithHistoricalPeriod."@en ;
        rdfs:comment "Video games and game releases may use prov:qualifiedAssociation with prov:Association nodes carrying prov:agent and prov:hadRole values; :DeveloperRole, :PublisherRole, and :DistributorRole are provided as named prov:Role values."@en ;
        rdfs:comment "Provenance records are PROV entities and may use prov:wasDerivedFrom, prov:wasAttributedTo, and prov:generatedAtTime. General resources may additionally use prov:wasDerivedFrom, prov:hadPrimarySource, dcterms:source, owl:sameAs, and skos:exactMatch where those external-vocabulary semantics are appropriate."@en ;
        rdfs:comment "Release windows are modeled with :hasReleaseWindow pointing to time:Interval; interval boundaries may use time:hasBeginning and time:hasEnd with time:Instant values whose dates are expressed by time:inXSDDate."@en ;
        rdfs:comment "Game extensions may use dcterms:creator with creators represented as prov:Agent resources."@en .
    
    ```
    
- Step 09 — Refine Turtle — First Pass
    
    ```
    Extend and refine the generated Turtle ontology to ensure completeness and consistency.
    
    Current Ontology:
    ###start_previous_turtle###
    {previous_step_content}
    ###end_previous_turtle###
    
    Review the entire ontology, not just a snippet.
    Identify missing classes, properties, hierarchy links, domains, ranges, axioms, labels, descriptions, and reuse alignments that are semantically justified.
    Remove conceptual redundancy by preferring existing terms when they express the same meaning.
    Do not add content merely to increase ontology size.
    
    Use the following reuse guidance where appropriate:
    Reuse Description: {reuse_example_desc}
    Reuse Examples: {few_shot_reuse}
    
    Return the refined Turtle ontology with valid syntax and coherent semantics.
    ```
    

[video_game_ontology_refined.ttl](video_game_ontology_refined.ttl)

- Step 10 — Refine Turtle — Second Pass
    
    ```
    Extend and refine the generated Turtle ontology to ensure completeness and consistency.
    
    Current Ontology:
    ###start_previous_turtle###
    {previous_step_content}
    ###end_previous_turtle###
    
    Review the entire ontology, not just a snippet.
    Identify missing classes, properties, hierarchy links, domains, ranges, axioms, labels, descriptions, and reuse alignments that are semantically justified.
    Remove conceptual redundancy by preferring existing terms when they express the same meaning.
    Do not add content merely to increase ontology size.
    
    Use the following reuse guidance where appropriate:
    Reuse Description: {reuse_example_desc}
    Reuse Examples: {few_shot_reuse}
    
    Return the refined Turtle ontology with valid syntax and coherent semantics.
    ```
    

[video_game_ontology_refined_v2.ttl](video_game_ontology_refined_v2.ttl)

- Step 11 — Data Properties
    
    ```
    Review the entire ontology and add missing data properties where they are semantically necessary.
    
    Current Ontology:
    ###start_previous_turtle###
    {previous_step_content}
    ###end_previous_turtle###
    
    Examples:
    {few_shot_data_properties}
    
    Follow these instructions:
    - Add appropriate data properties for entities.
    - Assign correct rdfs:domain and rdfs:range datatypes such as xsd:string, xsd:date, xsd:dateTime, xsd:boolean, xsd:integer, or other appropriate datatypes.
    - Modify domain and range according to the value represented by each data property.
    - Provide short natural-language descriptions using rdfs:comment where useful.
    - Process the whole ontology, not just a snippet.
    - Ensure syntax, prefixes, domains, ranges, and semantics are consistent.
    
    Output only new triples that do not already exist in the ontology.
    Do not repeat or regenerate existing triples.
    The goal is to extend the ontology, not rewrite it.
    Output strictly between ###start_turtle### and ###end_turtle### markers.
    ```
    
- Step 12 — Inverse Properties
    
    ```
    Review all object properties in the ontology and add an inverse property only where an inverse relationship is semantically meaningful and valid.
    An inverse property expresses a two-way relationship between two concepts; for example, hasPart may have the inverse isPartOf.
    Do not create an inverse merely because one is currently absent.
    
    Current Ontology:
    ###start_previous_turtle###
    {previous_step_content}
    ###end_previous_turtle###
    
    Follow these instructions:
    - Add owl:inverseOf declarations only where justified by the property semantics.
    - Keep naming consistent.
    - Preserve correct domains and ranges.
    - Avoid redundant or duplicate axioms.
    - Provide short rdfs:comment descriptions where appropriate.
    - Process the whole ontology, not just a snippet.
    
    Output only new triples that do not already exist in the ontology.
    Do not repeat existing triples.
    Output strictly between ###start_turtle### and ###end_turtle### markers.
    ```
    
- Step 13 — Reflexive Properties
    
    ```
    Review all object properties in the ontology and add owl:ReflexiveProperty declarations only where the relation is genuinely reflexive for every member of the relevant domain.
    A reflexive property is one where an entity is necessarily related to itself.
    Do not create a reflexive property merely because one is currently absent.
    
    Current Ontology:
    ###start_previous_turtle###
    {previous_step_content}
    ###end_previous_turtle###
    
    Follow these instructions:
    - Add owl:ReflexiveProperty only where logically justified.
    - Preserve consistency and avoid redundant axioms.
    - Check interaction with domains, ranges, disjointness, and other property characteristics.
    - Provide short rdfs:comment descriptions where appropriate.
    - Process the whole ontology, not just a snippet.
    
    Output only new triples that do not already exist in the ontology.
    Do not repeat existing triples.
    Output strictly between ###start_turtle### and ###end_turtle### markers.
    ```
    
- Step 14 — Symmetric Properties
    
    ```
    Review all object properties in the ontology and add owl:SymmetricProperty declarations only where the relation is genuinely symmetric.
    A symmetric property means that whenever entity A is related to entity B, entity B is necessarily related to entity A.
    Do not create a symmetric property merely because one is currently absent.
    
    Current Ontology:
    ###start_previous_turtle###
    {previous_step_content}
    ###end_previous_turtle###
    
    Follow these instructions:
    - Add owl:SymmetricProperty only where semantically justified.
    - Maintain domain and range correctness.
    - Avoid duplicates and redundant axioms.
    - Check compatibility with existing inverse and property hierarchy declarations.
    - Provide short rdfs:comment descriptions where appropriate.
    - Process the whole ontology, not just a snippet.
    
    Output only new triples that do not already exist in the ontology.
    Do not repeat existing triples.
    Output strictly between ###start_turtle### and ###end_turtle### markers.
    ```
    
- Step 15 — Functional Properties
    
    ```
    Review all relevant properties in the ontology and add owl:FunctionalProperty declarations only where each subject can validly have at most one value for that property.
    Do not create a functional property merely because one is currently absent.
    
    Current Ontology:
    ###start_previous_turtle###
    {previous_step_content}
    ###end_previous_turtle###
    
    Follow these instructions:
    - Add owl:FunctionalProperty only where the domain semantics guarantee at-most-one value.
    - Do not infer functionality from examples or accidental dataset uniqueness.
    - Preserve logical consistency and validate domains and ranges.
    - Check compatibility with existing cardinality restrictions.
    - Provide short rdfs:comment descriptions where appropriate.
    - Process the whole ontology, not just a snippet.
    
    Output only new triples that do not already exist in the ontology.
    Do not repeat existing triples.
    Output strictly between ###start_turtle### and ###end_turtle### markers.
    ```
    
- Step 16 — Transitive Properties
    
    ```
    Review all object properties in the ontology and add owl:TransitiveProperty declarations only where the relation is genuinely transitive.
    A transitive property means that if A is related to B and B is related to C, then A must also be related to C.
    Do not create a transitive property merely because one is currently absent.
    
    Current Ontology:
    ###start_previous_turtle###
    {previous_step_content}
    ###end_previous_turtle###
    
    Follow these instructions:
    - Add owl:TransitiveProperty only where semantically justified.
    - Maintain class hierarchy and logical integrity.
    - Check interaction with property chains, functionality, cardinality restrictions, and domains/ranges.
    - Avoid redundant axioms.
    - Provide short rdfs:comment descriptions where appropriate.
    - Process the whole ontology, not just a snippet.
    
    Output only new triples that do not already exist in the ontology.
    Do not repeat existing triples.
    Output strictly between ###start_turtle### and ###end_turtle### markers.
    ```
    
- Step 17 — Individuals
    
    ```
    Populate the ontology with meaningful real-world individuals when they are supported by the domain document or are necessary as well-grounded examples for the ontology.
    Do not fabricate individuals merely to increase ontology size.
    
    Examples of individuals:
    {few_shot_individuals}
    
    Domain Document:
    ###start_document###
    {document}
    ###end_document###
    
    Current Ontology:
    ###start_previous_turtle###
    {previous_step_content}
    ###end_previous_turtle###
    
    Follow these instructions:
    - Reuse an existing individual if it is already represented.
    - Assign the most appropriate class type or types.
    - Use existing object and data properties consistently.
    - Do not assert facts that are not supported by the document or other explicitly supplied evidence.
    - Keep IRIs and naming consistent.
    
    Output only new triples that do not already exist in the ontology.
    Do not repeat existing triples.
    Output strictly between ###start_turtle### and ###end_turtle### markers.
    ```
    
- Step 18 — Metadata
    
    ```
    If not already present in the ontology, add appropriate ontology metadata, including:
    - Ontology IRI
    - Ontology label
    - Version information
    - Natural-language description using rdfs:comment
    
    Current Ontology:
    ###start_previous_turtle###
    {previous_step_content}
    ###end_previous_turtle###
    
    Use standard RDF/OWL metadata properties where appropriate and keep identifiers consistent with the ontology namespace.
    Do not invent unsupported provenance or version claims.
    
    Output only new triples that do not already exist in the ontology.
    Do not repeat existing triples.
    Output strictly between ###start_turtle### and ###end_turtle### markers.
    ```
    
- Step 19 — Comments
    
    ```
    Review the complete ontology and add missing human-readable documentation for ontology terms where useful.
    
    Current Ontology:
    ###start_previous_turtle###
    {previous_step_content}
    ###end_previous_turtle###
    
    Follow these instructions:
    - Add concise and semantically accurate rdfs:comment descriptions for important classes, object properties, data properties, and other ontology terms that lack adequate documentation.
    - Prefer definitions that clarify intended meaning, scope, or relation semantics.
    - Do not change the meaning of existing ontology terms.
    - Do not add a comment when an adequate equivalent comment already exists.
    - Keep language and terminology consistent with the domain document.
    
    Output only new triples that do not already exist in the ontology.
    Do not repeat existing triples.
    Output strictly between ###start_turtle### and ###end_turtle### markers.
    ```
    
- Step 20 — Structural Refinement
    
    ```
    Perform a final structural refinement of the ontology.
    Use the full domain document and all 50 Competency Questions as the final grounding and coverage requirements.
    
    Domain Document:
    ###start_document###
    {document}
    ###end_document###
    
    Competency Questions:
    ###start_competency_questions###
    {competency_questions}
    ###end_competency_questions###
    
    Current Ontology:
    ###start_previous_turtle###
    {previous_step_content}
    ###end_previous_turtle###
    
    Reuse Guidance:
    {reuse_example_desc}
    {few_shot_reuse}
    
    Inspect the whole ontology and add only structurally necessary triples that are still missing.
    Check that:
    - CQ1 through CQ50 can be represented and answered through the ontology structure.
    - Important concepts and relations from the document are not omitted.
    - Class hierarchy and property hierarchy are coherent.
    - Domains and ranges are appropriate.
    - Reuse and alignment statements preserve the intended local semantics.
    - Inverse, reflexive, symmetric, functional, and transitive characteristics are present only where logically justified.
    - Duplicate or near-duplicate concepts are not introduced.
    - Prefixes and IRIs are consistent.
    - The resulting Turtle remains syntactically valid and logically coherent.
    
    Do not add content merely to increase ontology size.
    
    Output only new triples that do not already exist in the ontology.
    Do not repeat existing triples.
    Output strictly between ###start_turtle### and ###end_turtle### markers.
    ```
    

- Additional Step
    - Disjoint
        
        ```markdown
        Extend the ontology with well-supported class disjointness axioms.
        Declare classes disjoint only when the ontology provides sufficient evidence that no individual can belong to both classes.
        Do not add disjointness merely to increase ontology size or make the class hierarchy appear more structured.
        
        Examples of disjointness declarations:
        
        Current Ontology:
        ###start_previous_turtle###
        {previous_step_content}
        ###end_previous_turtle###
        
        Follow these instructions:
        
        * Use only existing named classes. Do not introduce new classes, properties, or individuals.
        * Use owl:disjointWith to express pairwise class disjointness.
        * Add a disjointness axiom only when mutual exclusivity is explicitly stated or follows unambiguously from the definitions and axioms in the current ontology.
        * Treat the examples as guidance for reasoning and output format, not as evidence about the current ontology.
        * Do not assume that classes are disjoint because they have different names, different descriptions, or the same superclass. Sibling classes are not automatically disjoint.
        * Follow the open-world assumption: the absence of a known shared individual is not evidence of disjointness.
        * Distinguish mutually exclusive categories from potentially overlapping roles, attributes, or statuses. Exclusivity limited to a particular time or context does not justify unconditional class disjointness.
        * Check each proposed axiom against the existing ontology and the other proposed axioms. Consider direct and indirect subclass relationships, equivalent classes, shared subclasses, and explicit or inferable class memberships.
        * Do not add axioms that would introduce an inconsistency or make a previously satisfiable named class unsatisfiable. In particular, do not declare a class disjoint with itself, an equivalent class, or one of its superclasses or subclasses.
        * Do not modify or remove existing axioms to accommodate a proposed declaration.
        * Avoid redundant declarations. Check for disjointness already represented by owl:disjointWith, owl:AllDisjointClasses, or entailed through the class hierarchy.
        * Disjointness is symmetric. Output each class pair only once; do not output both directions.
        * Keep IRIs, prefixes, and naming consistent with the current ontology.
        * When the evidence is ambiguous or insufficient, omit the declaration.
        
        Output only new owl:disjointWith triples that are neither already present nor entailed by the current ontology.
        Do not repeat existing triples.
        Do not include explanations, comments, or Markdown formatting in the output.
        Use valid Turtle syntax and include any prefix declarations needed to parse the output.
        If no justified new declarations can be made, output only the start and end markers with nothing between them.
        Output strictly between ###start_turtle### and ###end_turtle### markers.
        
        ```
        
    - Property Restriction
        
        ```markdown
        Extend the ontology with meaningful and well-supported OWL property restrictions.
        
        Add a property restriction to a class only when the semantics of the current ontology provide sufficient evidence that the restriction necessarily applies to every instance of that class.
        Do not add restrictions merely to increase ontology size or to make class definitions appear more complete.
        
        Examples of property restrictions:
        
        Current Ontology:
        ###start_previous_turtle###
        {previous_step_content}
        ###end_previous_turtle###
        
        Follow these instructions:
        
        - Use only existing classes and properties. Do not introduce new ontology concepts.
        - Add a property restriction only when it represents a necessary condition for every instance of the class, supported by the current ontology.
        - Use the appropriate OWL restriction type, such as owl, owl, owl, or cardinality restrictions, according to the intended semantics.
        - Do not infer mandatory restrictions merely from property domains, ranges, individual assertions, naming conventions, or typical real-world expectations.
        - Follow the open-world assumption. Lack of a property assertion does not imply that the property is absent.
        - Do not strengthen the available evidence. For example, do not interpret "may" or "can" as mandatory, "at least one" as "exactly one", or owl as requiring a value to exist.
        - Nested restrictions may be used when they are clearly supported by the class definition.
        - Avoid restrictions that are already present, inherited, or otherwise entailed by the ontology.
        - Do not add restrictions that would introduce inconsistency or make an existing named class unsatisfiable.
        - Keep IRIs, prefixes, datatypes, and modeling style consistent with the current ontology.
        - When the evidence is ambiguous or insufficient, omit the restriction.
        
        Output only new class-level property restriction triples that do not already exist or follow from the current ontology.
        Do not include explanations, comments, or repeated triples.
        Use valid Turtle syntax.
        
        If no justified new restriction can be generated, leave the content between the markers empty.
        
        Output strictly between ###start_turtle### and ###end_turtle### markers.
        
        ```
        

[video_game_ontology_final_merged.ttl](video_game_ontology_final_merged.ttl)