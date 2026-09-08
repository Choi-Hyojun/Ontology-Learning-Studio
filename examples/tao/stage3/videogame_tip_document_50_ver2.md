# 1) Conceptual Model & Pattern Guidance

The SRD is the modeling authority; the document supplies grounding, and the CQs supply coverage checks. This is a document-grounded OWL 2 DL design, not an independently verified account of current platforms, rating systems, or regulations. `Cl_` identifies classes; `Ind_` identifies individuals; properties use lower camel case. The proposed parent classes organize genuine shared meanings, not merely diagram layout. [Source: tip_instruction_ver2.txt, extracted lines 95–106] [Source: videogame_srd_document_50.json, extracted lines 308–314]

**Concept:** `Cl_VideoGame`  
**Represents:** An electronic game with player interaction affecting its visual output.  
**Modeling Approach (ODPs):** Taxonomy / Subclass under `Cl_ElectronicGame`. Require defining interaction and an operating platform, but not a winning condition, levels, or a fixed number of platforms.  
**Key Relationships:** `hasDefiningInteraction`, `producesVisualOutput`, `requiresPlatform`, `hasGameWorld`, `interactsWithWorld`, and optional `hasWinningCondition` and `hasLevel`. [Source: videogame_srd_document_50.json, extracted lines 68–81] [Source: Video Game Document.txt, extracted lines 25–27]

**Concept:** `Cl_PlayerInteraction`  
**Represents:** Interaction between a player and a game, including limited setup interaction.  
**Modeling Approach (ODPs):** Simple Relation. Identify players through game-specific relations to `Cl_Party`; do not create participation records or require every player action to affect a display.  
**Key Relationships:** `hasDefiningInteraction` connects a game to its defining interaction; `affectsVisualOutput` identifies the affected output; `playedBy` and `controlsAvatar` identify player roles. Zero-player mode does not mean no human involvement. [Source: videogame_srd_document_50.json, extracted lines 68–69] [Source: videogame_srd_document_50.json, extracted lines 242–245]

**Concept:** `Cl_Avatar`  
**Represents:** The in-game representation controlled by a player in the described gameplay.  
**Modeling Approach (ODPs):** Simple Relation. Make `Cl_Health` a subclass of `Cl_AvatarAttribute`; represent lives as countable allowances through `Cl_Life`. Record conditional loss and game-over behavior as qualified source notes, not executable state transitions.  
**Key Relationships:** `hasAttribute`, `mayBoostAttribute`, `depletesHealth`, `losesLife`, `gainsExtraLife`, and `reachesGameOverScreen`. Preserve both loss triggers: zero health **or** an impossible-to-escape location. [Source: videogame_srd_document_50.json, extracted lines 71–75]

**Concept:** `Cl_SavedGame`  
**Represents:** A recorded game state or a re-enterable passage that supports restarting.  
**Modeling Approach (ODPs):** Simple Relation; no save-event, storage-device, or temporal-interval model is needed.  
**Key Relationships:** `enablesRestartOf` links to `Cl_VideoGame`; its condition note covers losing all lives or stopping and later resuming play. Availability remains optional. [Source: videogame_srd_document_50.json, extracted lines 17–17] [Source: videogame_srd_document_50.json, extracted lines 76–76]

**Concept:** `Cl_HeadsUpDisplay`  
**Represents:** An on-screen user interface presenting gameplay information over the rendered game.  
**Modeling Approach (ODPs):** Taxonomy / Subclass under `Cl_OnScreenUserInterface`, with direct presentation and overlay relations.  
**Key Relationships:** `presentsInformation` to `Cl_GameplayInformation`; `overlaysVisualOutput` to `Cl_VisualOutput`. Do not identify the interface with its physical display device. [Source: videogame_srd_document_50.json, extracted lines 18–18] [Source: videogame_srd_document_50.json, extracted lines 77–77]

**Concept:** `Cl_VideoGamePlatform`  
**Represents:** The hardware-and-associated-software combination required to operate a game; “system” is an alternative label.  
**Modeling Approach (ODPs):** Partonymy/Meronymy. Reuse `Cl_PlatformComponent` as the parent of `Cl_Hardware` and `Cl_Software`; do not impose component counts.  
**Key Relationships:** `hasComponent`, `requiresPlatform`, and `designedFor`. Preserve “typically one or a limited number” as a qualification, not an upper bound. [Source: videogame_srd_document_50.json, extracted lines 78–81]

**Concept:** `Cl_Device`  
**Represents:** Physical equipment used in the described platforms and interaction.  
**Modeling Approach (ODPs):** Taxonomy / Subclass under `Cl_Hardware`, with Partonymy/Meronymy for integrated equipment. Distinguish handheld devices from the console components they contain.  
**Key Relationships:** `hasDevicePart`, `translatesHumanAction`, `producesGameInput`, and `displaysVisualOutput`. Handheld parts include a console, built-in screen, speakers, and controls; head-mounted units provide stereoscopic screens and motion tracking. Global positioning information is information, not a device. [Source: videogame_srd_document_50.json, extracted lines 96–107] [Source: videogame_srd_document_50.json, extracted lines 114–117]

**Concept:** `Cl_PlatformCategory`  
**Represents:** Relational platform-based classification values, including arcade, console, computer, mobile, VR, AR, and cloud groupings.  
**Modeling Approach (ODPs):** Explicit Typing through `hasPlatformCategory`; use category-value individuals, not game subclasses. “Computer Game” here is the PC/platform grouping, not an unrestricted synonym for all video games.  
**Key Relationships:** Category-tagged games use `computedAndRenderedOn`, `requiresHeadMountedUnit`, and related equipment properties where supported. Cloud computation is remote; VR equipment is generally required; mobile AR features are optional. [Source: videogame_srd_document_50.json, extracted lines 82–88] [Source: videogame_srd_document_50.json, extracted lines 100–105] [Source: videogame_srd_document_50.json, extracted lines 313–313]

**Concept:** `Cl_VersionForm`  
**Represents:** The relational version-form values Port, Remaster, and Remake.  
**Modeling Approach (ODPs):** Explicit Typing plus a direct derivation relation. Forms can overlap; do not introduce corresponding game subclasses, make them disjoint, or make `isVersionOf` a subclass relation.  
**Key Relationships:** `hasVersionForm`, `isVersionOf`, `targetsPlatform`, `originallyIntendedFor`, `reusesSourceCode`, and `updatesContent`. Label Port also “Conversion.” Retain “most source code,” “significant reworking,” and “possibly from scratch” without invented percentages. [Source: videogame_srd_document_50.json, extracted lines 89–95] [Source: Video Game Document.txt, extracted lines 43–43]

**Concept:** `Cl_Emulator`  
**Represents:** Software enabling another system’s games to run by simulating its hardware in a virtual machine.  
**Modeling Approach (ODPs):** Taxonomy / Subclass under `Cl_Software`, with Simple Relation for simulation and execution. Keep `Cl_BackwardCompatibility` separate as a platform capability, not an emulator subtype.  
**Key Relationships:** `simulatesHardware`, `usesVirtualMachine`, `runsOnPlatform`, `hasBackwardCompatibility`, and `enablesExecutionOf`. Backward compatibility’s direct use of newer hardware and built-in software is typical, not universal. [Source: videogame_srd_document_50.json, extracted lines 31–33] [Source: videogame_srd_document_50.json, extracted lines 108–109]

**Concept:** `Cl_GameExtension`  
**Represents:** Additions or modifications that extend or change an existing game.  
**Modeling Approach (ODPs):** A reusable parent for expansion packs, downloadable content, and user-created modifications. Use direct extension relations; organize physical media separately with genuine format subclasses.  
**Key Relationships:** `extendsGame`, `altersOrAddsTo`, `providesContent`, `providesPatch`, and `createdByPlayer`. Physical delivery of expansion packs, digital delivery of DLC, and unofficial mod status remain qualified, not mandatory. [Source: videogame_srd_document_50.json, extracted lines 110–113] [Source: Video Game Document.txt, extracted lines 89–91]

**Concept:** `Cl_GameGenre`  
**Represents:** Genre descriptors used for relational classification, distinct from classes whose instances are games.  
**Modeling Approach (ODPs):** Simple Relation for `hasGenre`; genuine Taxonomy / Subclass for Shooter Game, First-Person Shooter, and Third-Person Shooter. Represent action-adventure as a cross-genre descriptor without inventing its parent genres. Do not duplicate shooter classes as descriptor individuals.  
**Key Relationships:** `hasGenre` and non-functional `broaderGenre`. Gameplay interaction is the general classification basis; retain the narrative-based horror exception. Do not impose a single-parent tree. [Source: videogame_srd_document_50.json, extracted lines 124–125] [Source: videogame_srd_document_50.json, extracted lines 202–204] [Source: Video Game Document.txt, extracted lines 111–113]

**Concept:** `Cl_GameMode`  
**Represents:** A participation classification describing simultaneous player use.  
**Modeling Approach (ODPs):** Explicit Typing using Single-Player, Multiplayer, and Zero-Player values. No corresponding game subclasses or universal player cardinalities.  
**Key Relationships:** `hasMode`, `simultaneousPlayerCount`, `allowsPlayArrangement`, and `hasPossibleGameplayStyle`. Multiplayer arrangements are alternatives; competitive prevalence and the availability of cooperative, team-based, and asymmetric play retain their qualifiers. [Source: videogame_srd_document_50.json, extracted lines 126–137]

**Concept:** `Cl_SeriousGame`  
**Represents:** Games designed to reinforce purposes beyond entertainment.  
**Modeling Approach (ODPs):** Taxonomy / Subclass for the SRD’s purpose-based game types. Keep Core, Casual, Serious, and Art Game classes non-disjoint. Educational Game has the narrower Edutainment Game and Educational Video Game branches.  
**Key Relationships:** `hasPurpose`, `hasDesignCharacteristic`, and `intendedToGenerate`. Art-game emotion and empathy are intended responses, not guaranteed effects; core-game learning time remains qualitative. [Source: videogame_srd_document_50.json, extracted lines 138–144] [Source: videogame_srd_document_50.json, extracted lines 194–197] [Source: videogame_srd_document_50.json, extracted lines 222–232]

**Concept:** `Cl_Party`  
**Represents:** People or organizations filling player, development, delivery, provider, and consumer roles.  
**Modeling Approach (ODPs):** Simple Relation using role-specific properties. No separate role individuals, participation classes, or development/delivery event are needed; one party can fill several roles.  
**Key Relationships:** `developedBy`, `publishedBy`, `distributedBy`, `retailedBy`, `marketedBy`, `manufacturedBy`, and `hasConsumer`. Hardware manufacturing relates a party to hardware, rather than treating a game as manufactured hardware. [Source: videogame_srd_document_50.json, extracted lines 168–179]

**Concept:** `Cl_ContentRatingSystem`  
**Represents:** A rating scheme, distinct from an organization and from an assigned content rating.  
**Modeling Approach (ODPs):** Explicit Typing for named entities and direct regional relations. PEGI is a system individual; ESRB, ACB, CERO, and USK are organization individuals. Use annotations for partial regional scope, general voluntariness, and the document’s ACB legal-enforcement exception.  
**Key Relationships:** `usesMinimumAgeIdentifier`, `usesContentDescriptor`, `influencedByTheme`, and `providesRatingsIn`. Do not introduce rating-scale mappings, unsupported numeric labels, or exhaustive European coverage. [Source: videogame_srd_document_50.json, extracted lines 145–163] [Source: videogame_srd_document_50.json, extracted lines 248–251]

**Concept:** `Cl_ContentRatingProcess`  
**Represents:** The content-rating review and subsequent IARC cross-region affirmation described in the SRD.  
**Modeling Approach (ODPs):** Minimal Event/process context: `Cl_ContentRatingReview` and `Cl_CrossRegionRatingAffirmation` preserve which completed review, publisher, provider, rating, and target regions belong together. These are source-specified activities, not an event layer added to every relationship.  
**Key Relationships:** `submittedBy`, `reviewedWith`, `basedOnCompletedReview`, `affirmsRating`, `affirmedForRegion`, and `facilitatedBy`. One-provider review is sufficient; do not impose an exact-one provider constraint or invent process occurrences. [Source: videogame_srd_document_50.json, extracted lines 182–189]

# 2) Reuse & Extension Plan

**Extend/Reuse:** None for external domain ontologies: no existing ontology is supplied, and importing one is unnecessary. Use standard RDF/RDFS/OWL/XSD vocabulary. Reuse the local parent classes and the lightweight Explicit Typing, Partonymy/Meronymy, and provenance approaches described above. The CQ hint “Functional Relation” does **not** require `owl:FunctionalProperty`. [Source: tip_instruction_ver2.txt, extracted lines 8–14] [Source: tip_instruction_ver2.txt, extracted lines 80–89]

**Create New — classes and hierarchy.** In the registry below, `A → B` means **A is a subclass of B**. Comma-separated classes before an arrow share the stated parent. No disjointness or exhaustive partitions are implied.

| Area | Classes and hierarchy |
|---|---|
| Core games | `Cl_VideoGame → Cl_ElectronicGame`; `Cl_ShooterGame`, `Cl_CoreGame`, `Cl_CasualGame`, `Cl_SeriousGame`, `Cl_ArtGame → Cl_VideoGame`; `Cl_FirstPersonShooter`, `Cl_ThirdPersonShooter → Cl_ShooterGame`. |
| Serious and educational types | `Cl_EducationalGame`, `Cl_FitnessGame`, `Cl_SimulatorGame`, `Cl_Advergame`, `Cl_Newsgame → Cl_SeriousGame`; `Cl_EdutainmentGame`, `Cl_EducationalVideoGame → Cl_EducationalGame`. The latter retains the narrower problem-solving meaning. |
| Gameplay | `Cl_PlayerInteraction`, `Cl_GameWorld`, `Cl_WinningCondition`, `Cl_Avatar`, `Cl_AvatarAttribute`, `Cl_PowerUp`, `Cl_Damage`, `Cl_Life`, `Cl_SavedGame`, `Cl_GameplayInformation`; `Cl_Health → Cl_AvatarAttribute`; `Cl_HeadsUpDisplay`, `Cl_GameOverScreen → Cl_OnScreenUserInterface`. |
| Content | `Cl_ArtAsset`, `Cl_GameModel` (in-game models), `Cl_Level → Cl_GameContent`; `Cl_SourceCode`, `Cl_VisualOutput`, `Cl_HumanAction`, `Cl_GameInput`, `Cl_GlobalPositioningInformation`, `Cl_AugmentedRealityGameplay`, `Cl_MotionTracking`, `Cl_HapticTechnology`, `Cl_TactileFeedback`. |
| Platform components | `Cl_VideoGamePlatform`; `Cl_Hardware`, `Cl_Software → Cl_PlatformComponent`; `Cl_Device`, `Cl_RemoteHardware → Cl_Hardware`; `Cl_Emulator`, `Cl_SoftwarePatch → Cl_Software`; `Cl_VirtualMachine`, `Cl_BackwardCompatibility`. |
| Devices | `Cl_Console`, `Cl_HandheldGameConsole`, `Cl_MobileDevice`, `Cl_InputDevice`, `Cl_DisplayDevice`, `Cl_Speaker`, `Cl_HeadMountedUnit`, `Cl_Accelerometer`, `Cl_Camera → Cl_Device`; `Cl_GameController → Cl_InputDevice`; `Cl_SpecializedController → Cl_GameController`; `Cl_RacingWheel`, `Cl_LightGun`, `Cl_DancePad → Cl_SpecializedController`; `Cl_Television`, `Cl_BuiltInScreen`, `Cl_Projector`, `Cl_ComputerMonitor`, `Cl_StereoscopicScreen → Cl_DisplayDevice`. |
| Classification values | `Cl_PlatformCategory`, `Cl_VersionForm`, `Cl_GameMode`, `Cl_VisualOutputForm`, `Cl_PlayArrangement`, `Cl_GameplayStyle`, `Cl_GameGenre → Cl_ClassificationValue`; `Cl_TopLevelGenre`, `Cl_CrossGenreType → Cl_GameGenre`. Classification values are descriptors, not game instances. |
| Game extensions | `Cl_ExpansionPack`, `Cl_DownloadableContent`, `Cl_UserCreatedModification → Cl_GameExtension`. |
| Physical media | `Cl_ROMCartridge`, `Cl_MagneticStorage`, `Cl_OpticalMedia`, `Cl_FlashMemoryCard → Cl_PhysicalGameMedia`; `Cl_MagneticTape`, `Cl_FloppyDisc → Cl_MagneticStorage`; `Cl_CDROM`, `Cl_DVD → Cl_OpticalMedia`. |
| Design and intention | `Cl_DesignCharacteristic`, `Cl_GamePurpose`, `Cl_IntendedPlayerResponse`. Values describe design or intent, not guaranteed player states. |
| Parties and ratings | `Cl_Party`; `Cl_ContentRatingOrganization → Cl_Party`; `Cl_ContentRating`, `Cl_ContentRatingSystem`, `Cl_MinimumAgeIdentifier`, `Cl_ContentDescriptor`, `Cl_ContentTheme`, `Cl_Region`; `Cl_ContentRatingReview`, `Cl_CrossRegionRatingAffirmation → Cl_ContentRatingProcess`. |

The explicit game, media, controller, and display taxonomies follow the SRD. Added parents such as `Cl_Device`, `Cl_PlatformComponent`, `Cl_ClassificationValue`, `Cl_GameContent`, `Cl_GameExtension`, and `Cl_ContentRatingProcess` are implementation abstractions with reusable property domains or ranges—not new source facts. No `Cl_Port`, `Cl_Remaster`, `Cl_CloudGame`, or `Cl_MultiplayerGame` is created. [Source: videogame_srd_document_50.json, extracted lines 200–232] [Source: videogame_srd_document_50.json, extracted lines 313–313]

**Create New — object properties.** Arrows in this registry mean **domain → range**, not subclass. A union is one union expression; declaring several domains separately would incorrectly require membership in their intersection. Properties describe particular supported relationships; their declaration does not assert that every instance has a value.

| Properties | Domain → range | Implementation scope |
|---|---|---|
| `hasDefiningInteraction`; `affectsVisualOutput` | `Cl_VideoGame → Cl_PlayerInteraction`; `Cl_PlayerInteraction → Cl_VisualOutput` | Only defining interaction is required. |
| `producesVisualOutput`; `hasVisualOutputForm` | `Cl_VideoGame → Cl_VisualOutput`; `Cl_VisualOutput → Cl_VisualOutputForm` | Output form is non-exclusive. |
| `hasGameWorld`; `hasWinningCondition`; `hasLevel` | `Cl_VideoGame → Cl_GameWorld`; `Cl_VideoGame → Cl_WinningCondition`; `Cl_VideoGame → Cl_Level` | Winning conditions and levels are not universally required. |
| `playedBy`; `controlsAvatar`; `interactsWithWorld`; `hasAttribute` | `Cl_VideoGame → Cl_Party`; `Cl_Party → Cl_Avatar`; `Cl_Party → Cl_GameWorld`; `Cl_Avatar → Cl_AvatarAttribute` | Player is a contextual relation, not a permanent identity. |
| `mayBoostAttribute`; `depletesHealth` | `Cl_PowerUp → Cl_AvatarAttribute`; `Cl_Damage → Cl_Health` | Described gameplay scope; no numeric update rules. |
| `losesLife`, `gainsExtraLife`; `reachesGameOverScreen` | `Cl_Party → Cl_Life`; `Cl_Party → Cl_GameOverScreen` | Preserve loss and game-over conditions; “1-UP” labels the extra-life terminology. |
| `enablesRestartOf`; `presentsInformation`; `overlaysVisualOutput` | `Cl_SavedGame → Cl_VideoGame`; `Cl_HeadsUpDisplay → Cl_GameplayInformation`; `Cl_HeadsUpDisplay → Cl_VisualOutput` | Restart conditions and HUD overlay are distinct. |
| `requiresPlatform`, `designedFor`, `originallyIntendedFor`, `targetsPlatform` | `Cl_VideoGame → Cl_VideoGamePlatform` | Separate operational requirement, design intent, original intent, and derivative target. |
| `hasComponent`; `hasDevicePart` | `Cl_VideoGamePlatform → Cl_PlatformComponent`; `Cl_Device → Cl_Device` | Non-transitive by default; no part counts or ordered lists. |
| `hasPlatformCategory`; `hasVersionForm`; `isVersionOf` | `Cl_VideoGame → Cl_PlatformCategory`; `Cl_VideoGame → Cl_VersionForm`; `Cl_VideoGame → Cl_VideoGame` | Facets may overlap; derivation is not taxonomy. |
| `reusesSourceCode`; `updatesContent` | `Cl_VideoGame → Cl_SourceCode`; `Cl_VideoGame → Cl_GameContent` | Apply to supported derivative records; retain extent and modern-system context. |
| `computedAndRenderedOn`; `providedBy` | `Cl_VideoGame → Cl_RemoteHardware`; `Cl_RemoteHardware → Cl_Party` | The latter identifies the cloud gaming provider’s role. |
| `requiresHeadMountedUnit`; `providesMotionTracking` | `Cl_VideoGame → Cl_HeadMountedUnit`; `Cl_HeadMountedUnit → Cl_MotionTracking` | “Generally” applies to VR-game equipment requirements. |
| `providesPositioningInformation`; `maySupportARGameplay` | `Cl_MobileDevice → Cl_GlobalPositioningInformation`; `(Cl_Device ∪ Cl_GlobalPositioningInformation) → Cl_AugmentedRealityGameplay` | Accelerometers/cameras are devices; positioning information is not. |
| `simulatesHardware`; `usesVirtualMachine`; `runsOnPlatform` | `Cl_Emulator → Cl_Hardware`; `Cl_Emulator → Cl_VirtualMachine`; `Cl_VirtualMachine → Cl_VideoGamePlatform` | Connect original hardware, simulation environment, and host platform. |
| `hasBackwardCompatibility`; `enablesExecutionOf` | `Cl_VideoGamePlatform → Cl_BackwardCompatibility`; `(Cl_Emulator ∪ Cl_BackwardCompatibility) → Cl_VideoGame` | Keep original/older/newer context in source notes; no chronology classes. |
| `mayBeDistributedOn` | `Cl_VideoGame → Cl_PhysicalGameMedia` | Physical distribution is optional. |
| `extendsGame`; `altersOrAddsTo`; `createdByPlayer` | `Cl_GameExtension → Cl_VideoGame`; `Cl_UserCreatedModification → Cl_VideoGame`; `Cl_UserCreatedModification → Cl_Party` | `altersOrAddsTo` specializes `extendsGame`; no assertion that all mods are unofficial. |
| `providesContent`; `providesPatch` | `Cl_GameExtension → Cl_GameContent`; `Cl_GameExtension → Cl_SoftwarePatch` | Source-supported potential contents of expansion packs and DLC; do not infer provision for every extension subtype from the property domain. |
| `translatesHumanAction`; `producesGameInput`; `mayBeUsedForGenre` | `Cl_InputDevice → Cl_HumanAction`; `Cl_InputDevice → Cl_GameInput`; `Cl_SpecializedController → Cl_GameGenre` | Do not invent controller-to-genre pairs. |
| `displaysVisualOutput`; `providesTactileFeedback` | `Cl_DisplayDevice → Cl_VisualOutput`; `Cl_HapticTechnology → Cl_TactileFeedback` | Do not equate visual output with a physical screen. |
| `hasGenre`; `broaderGenre` | `Cl_VideoGame → Cl_GameGenre`; `Cl_GameGenre → Cl_GameGenre` | Permit multiple genre values/parents; leave unspecified parents unasserted. |
| `hasMode`; `allowsPlayArrangement`; `hasPossibleGameplayStyle` | `Cl_VideoGame → Cl_GameMode`; `Cl_GameMode → Cl_PlayArrangement`; `Cl_GameMode → Cl_GameplayStyle` | The last two describe options within a mode category, not obligations for every game in it. |
| `hasDesignCharacteristic`; `hasPurpose`; `intendedToGenerate` | `Cl_VideoGame → Cl_DesignCharacteristic`; `Cl_VideoGame → Cl_GamePurpose`; `Cl_VideoGame → Cl_IntendedPlayerResponse` | Preserve design intention rather than guaranteed outcomes. |
| `developedBy`, `publishedBy`, `distributedBy`, `retailedBy`, `marketedBy`, `hasConsumer`; `manufacturedBy` | `Cl_VideoGame → Cl_Party`; `Cl_Hardware → Cl_Party` | No required distinct party for each role. |
| `hasContentRating`; `usesMinimumAgeIdentifier`; `usesContentDescriptor` | `Cl_VideoGame → Cl_ContentRating`; `Cl_ContentRatingSystem → Cl_MinimumAgeIdentifier`; `Cl_ContentRatingSystem → Cl_ContentDescriptor` | “Nearly all systems” does not become mandatory identifier/descriptor restrictions. |
| `influencedByTheme`; `providesRatingsIn` | `Cl_ContentRating → Cl_ContentTheme`; `(Cl_ContentRatingOrganization ∪ Cl_ContentRatingSystem) → Cl_Region` | Regional relation means coverage within a region, not coverage of every place in it. |
| `concernsRating`; `submittedBy`, `reviewedWith` | `Cl_ContentRatingProcess → Cl_ContentRating`; `Cl_ContentRatingReview → Cl_Party` | Publisher and provider remain scoped to the same review. |
| `basedOnCompletedReview`; `affirmsRating`; `affirmedForRegion`; `facilitatedBy` | `Cl_CrossRegionRatingAffirmation → Cl_ContentRatingReview`; `Cl_CrossRegionRatingAffirmation → Cl_ContentRating`; `Cl_CrossRegionRatingAffirmation → Cl_Region`; `Cl_CrossRegionRatingAffirmation → Cl_Party` | `affirmsRating` specializes `concernsRating`; completed-review dependency preserves ordering without a timeline. |

These signatures operationalize the SRD’s relationships and activity context. They are schema proposals, not claims that unspecified games, players, hardware units, or review occurrences exist. [Source: videogame_srd_document_50.json, extracted lines 67–81] [Source: videogame_srd_document_50.json, extracted lines 168–189] [Source: videogame_srd_document_50.json, extracted lines 311–312]

**Create New — data and annotation properties.** `healthValue: Cl_Health → xsd:decimal` supports an explicitly supplied health value; the loss threshold does not establish any actual avatar’s health. `simultaneousPlayerCount: Cl_GameMode → xsd:nonNegativeInteger` supports explicit counts: Single-Player has value `1`; Multiplayer has no exact count supplied; Zero-Player receives no invented assertion of zero human involvement. No numeric core-game duration, remaster percentage, platform maximum, life-loss cardinality, or rating age is populated from this SRD. Use labels for lexical identifiers and descriptors until concrete rating records are supplied. [Source: videogame_srd_document_50.json, extracted lines 74–75] [Source: videogame_srd_document_50.json, extracted lines 127–130] [Source: videogame_srd_document_50.json, extracted lines 194–197]

Create local annotation properties `sourceLocator`, `qualification`, and `condition`, alongside `rdfs:label` and `rdfs:comment`. Record file/JSON-path or document-section provenance, attach qualifiers to the relevant class, facet value, property, or axiom, and avoid generic notes whose scope is ambiguous. For example, the remaster reuse qualifier belongs to the Remaster form, not every use of `reusesSourceCode`. Annotation retrieval is required for statistical claims, relative conditions, and qualitative duration; OWL reasoning must not pretend to evaluate them. In particular, annotate `losesLife` with “one life is lost when avatar health reaches zero OR the avatar enters an impossible-to-escape location,” scoped to the described gameplay; do not turn that conditional count into an OWL cardinality. [Source: tip_instruction_ver2.txt, extracted lines 98–106] [Source: videogame_srd_document_50.json, extracted lines 74–75]

**Create New — named individuals and controlled values.** These are vocabulary values and source-named entities, not invented game or event examples. Do not also declare any of these identifiers as classes.

| Type | Individuals / labels |
|---|---|
| `Cl_PlatformCategory` | `Ind_ArcadeVideoGame`, `Ind_ConsoleGame`, `Ind_ComputerGame`, `Ind_MobileGame`, `Ind_VirtualRealityGame`, `Ind_AugmentedRealityGame`, `Ind_CloudGame`. |
| `Cl_VersionForm` | `Ind_Port` (also “Conversion”), `Ind_Remaster`, `Ind_Remake`. |
| `Cl_GameMode` | `Ind_SinglePlayer`, `Ind_Multiplayer`, `Ind_ZeroPlayer`. |
| `Cl_VisualOutputForm` | `Ind_FixedDisplay` (“using LED or LCD elements”), `Ind_TextBasedOutput`, `Ind_TwoDimensionalGraphics`, `Ind_ThreeDimensionalGraphics`, `Ind_AugmentedRealityDisplay`. |
| `Cl_PlayArrangement` | `Ind_SameDevice`, `Ind_SeparateDevicesLocalNetwork`, `Ind_SeparateDevicesInternet`. |
| `Cl_GameplayStyle` | `Ind_CompetitiveGameplay`, `Ind_CooperativeGameplay`, `Ind_TeamBasedGameplay`, `Ind_AsymmetricGameplay`. |
| Genre descriptors | `Ind_ActionAdventure: Cl_CrossGenreType`; `Ind_Horror: Cl_GameGenre`. No particular action-adventure parent genres are supplied. |
| `Cl_DesignCharacteristic` | `Ind_EaseOfAccessibility`, `Ind_SimpleToUnderstandGameplay`, `Ind_QuickToGraspRuleSets`. |
| `Cl_GamePurpose`; `Cl_IntendedPlayerResponse` | `Ind_NonEntertainmentPurpose`, `Ind_Entertainment`; `Ind_Emotion`, `Ind_Empathy`. |
| `Cl_ContentTheme` | `Ind_Violence`, `Ind_SexualContent`, `Ind_DrugUse`, `Ind_AlcoholUse`, `Ind_Gambling`. |
| Rating entities | `Ind_ESRB`, `Ind_ACB`, `Ind_CERO`, `Ind_USK: Cl_ContentRatingOrganization`; `Ind_PEGI: Cl_ContentRatingSystem`; `Ind_IARC: Cl_Party`, acting as the cross-region facilitator—not asserted to assign ratings itself. |
| `Cl_Region` | `Ind_UnitedStates`, `Ind_UnitedKingdom`, `Ind_EuropeanUnion`, `Ind_Australia`, `Ind_Japan`, `Ind_Germany`. “Other European countries” remains an unenumerated scope note, not a fabricated country list. |

The facet options and named rating entities come from the SRD; the horror descriptor preserves the source’s stated genre exception. [Source: videogame_srd_document_50.json, extracted lines 119–164] [Source: Video Game Document.txt, extracted lines 111–111]

**Axiom and assertion policy.** Implement the explicit taxonomies and only the following source-supported structural necessities initially. Here `some` denotes an existential restriction, `value` denotes a named-value restriction, and `and` denotes intersection; these are design expressions, not Turtle.

`Cl_VideoGame ⊑ requiresPlatform some Cl_VideoGamePlatform`.

`Cl_VideoGame ⊑ hasDefiningInteraction some (Cl_PlayerInteraction and (affectsVisualOutput some Cl_VisualOutput))`.

`hasDefiningInteraction ∘ affectsVisualOutput ⊑ producesVisualOutput`, ensuring the affected output is also associated with that game rather than an unrelated output.

`Cl_VideoGamePlatform ⊑ (hasComponent some Cl_Hardware) and (hasComponent some Cl_Software)`.

For cloud-tagged games, use the anonymous expression `(Cl_VideoGame and (hasPlatformCategory value Ind_CloudGame)) ⊑ computedAndRenderedOn some (Cl_RemoteHardware and (providedBy some Cl_Party))`. This preserves the cloud definition without creating a platform-based game subclass. The interaction, platform, and cloud necessities are grounded in unqualified SRD statements; no corresponding universal headset requirement is added for VR. [Source: videogame_srd_document_50.json, extracted lines 68–69] [Source: videogame_srd_document_50.json, extracted lines 78–80] [Source: videogame_srd_document_50.json, extracted lines 103–105]

Use ordinary class restrictions for further unqualified structure: handheld units have console, built-in-screen, speaker, and controller parts; head-mounted units have stereoscopic-screen parts and provide motion tracking. Require existence of the stated component kinds, not exact component numbers or every alternative control type. Remaster-tagged games have source-code reuse and updated art-asset, model, and level content; annotate **most of the original code** and **for modern systems**, rather than inventing a percentage or requiring all source code to be reused. For remake-tagged games, represent asset improvements with `updatesContent`; retain significant reworking and the possibility of starting from scratch as scope notes. The IARC affirmation class denotes specifically the process described in the SRD: it depends on a completed review, affirms a rating for another region, and is facilitated by `Ind_IARC`; do not instantiate an occurrence merely to express that process definition. [Source: videogame_srd_document_50.json, extracted lines 24–24] [Source: videogame_srd_document_50.json, extracted lines 94–107] [Source: videogame_srd_document_50.json, extracted lines 182–189]

Populate `providesRatingsIn` with ESRB–United States, PEGI–United Kingdom, PEGI–European Union, ACB–Australia, CERO–Japan, and USK–Germany. On PEGI’s EU coverage assertion, retain **most of the European Union**; retain **other European countries, not enumerated** as an additional scope note. Because this property means coverage *within* a region, the EU assertion does not claim complete EU coverage. Attach the document’s ACB legal-enforcement exception to `Ind_ACB`, without treating it as independently verified current law. [Source: videogame_srd_document_50.json, extracted lines 157–163] [Source: videogame_srd_document_50.json, extracted lines 248–251]

Populate the three possible `allowsPlayArrangement` values and four `hasPossibleGameplayStyle` values on `Ind_Multiplayer`. These are available options within the mode category, not inherited requirements for all multiplayer games. Preserve **most** for competition and **many** for cooperative, team-based, and asymmetric options. Attach zero-player setup/observation, core-game qualitative duration, serious-game entertainment effects, genre-basis exceptions, and general rating-system practices to their scoped vocabulary elements as qualified notes. [Source: videogame_srd_document_50.json, extracted lines 131–142] [Source: videogame_srd_document_50.json, extracted lines 194–197] [Source: videogame_srd_document_50.json, extracted lines 242–251]

For unqualified design intentions, use has-value restrictions: Core Game has purpose `Ind_Entertainment`; Casual Game has the three stated design characteristics; Serious Game has `Ind_NonEntertainmentPurpose`; Art Game is `intendedToGenerate` `Ind_Emotion` and `Ind_Empathy`. The predicate expresses intent, never an actual emotional outcome. Do not make these sufficient definitions, exclusive memberships, or complete lists of characteristics and purposes. [Source: videogame_srd_document_50.json, extracted lines 138–144] [Source: Video Game Document.txt, extracted lines 127–127]

**Implementation and acceptance checks.** Create the hierarchy and property schema, load the controlled values and named regional assertions, attach scoped source notes, and then check all 50 CQ mappings below. Use taxonomy/restriction inspection for schema questions, ordinary graph queries for named facts and vocabulary options, and annotation retrieval for qualified answers. No named game dataset is supplied, so instance-only queries cannot demonstrate all CQs.

Check that a game can consistently lack a winning-condition assertion or levels; that absence of a triple is not interpreted as proven absence; that platform, version, and mode facets can overlap; that no class is also used as its descriptor individual; and that PEGI is not inferred to be an organization or positioning information to be hardware. Confirm that ports’ alternative-platform status comes from positive source evidence, not missing original-platform triples. Reject invented controller/genre pairs, action-adventure parents, exact player/platform limits, numeric mastery durations, and rating-scale mappings. Validate conditions as source-text coverage, not simulated gameplay. No equivalence, disjointness, property functionality, or exact cardinality is required by this plan. [Source: videogame_srd_document_50.json, extracted lines 282–284] [Source: videogame_srd_document_50.json, extracted lines 288–304] [Source: tip_instruction_ver2.txt, extracted lines 95–106]

# 3) Competency Question Alignment

In the mappings below, “Simple Relation” may include scoped qualification or condition annotations where the answer is not an unconditional OWL assertion. Platform, version, and participation terms resolve to their facet classes rather than game subclasses.

**Question:** What broader category of games includes video games?  
**Answer:** Electronic games. [Source: videogame_cq_document_50.json, extracted lines 4–7]  
**Classes:** `Cl_VideoGame`, `Cl_ElectronicGame`.  
**ODP:** Taxonomy / Subclass.

**Question:** What kind of interactivity is considered necessary for a video game?  
**Answer:** Interactivity that affects the visual display. [Source: videogame_cq_document_50.json, extracted lines 10–13]  
**Classes:** `Cl_VideoGame`, `Cl_PlayerInteraction`, `Cl_VisualOutput`.  
**ODP:** Simple Relation.

**Question:** Can a video game lack a winning condition?  
**Answer:** Yes. Games without winning conditions can still be considered video games when players can interact with their game worlds. [Source: videogame_cq_document_50.json, extracted lines 16–19]  
**Classes:** `Cl_VideoGame`, `Cl_WinningCondition`, `Cl_GameWorld`, `Cl_Party`.  
**ODP:** Simple Relation, with qualified source annotation.

**Question:** What are most video games divided into for player progression?  
**Answer:** Most video games are divided into levels. [Source: videogame_cq_document_50.json, extracted lines 22–25]  
**Classes:** `Cl_VideoGame`, `Cl_Level`.  
**ODP:** Partonymy/Meronymy, with “most” qualification.

**Question:** What effect can a power-up have on an avatar?  
**Answer:** A power-up can boost the avatar's innate attributes. [Source: videogame_cq_document_50.json, extracted lines 28–31]  
**Classes:** `Cl_PowerUp`, `Cl_Avatar`, `Cl_AvatarAttribute`.  
**ODP:** Simple Relation.

**Question:** What effect does taking damage have on an avatar's health?  
**Answer:** Taking damage depletes the avatar's health. [Source: videogame_cq_document_50.json, extracted lines 34–37]  
**Classes:** `Cl_Damage`, `Cl_Avatar`, `Cl_Health`.  
**ODP:** Simple Relation.

**Question:** Under what conditions does a player lose a life in the gameplay described?  
**Answer:** When the avatar's health falls to zero or the avatar enters an impossible-to-escape location. [Source: videogame_cq_document_50.json, extracted lines 40–43]  
**Classes:** `Cl_Party`, `Cl_Avatar`, `Cl_Health`, `Cl_Life`.  
**ODP:** Simple Relation, with conditional source annotation.

**Question:** When does a player reach the game-over screen in the gameplay described?  
**Answer:** When the player loses all lives without gaining an extra life. [Source: videogame_cq_document_50.json, extracted lines 46–49]  
**Classes:** `Cl_Party`, `Cl_Life`, `Cl_GameOverScreen`.  
**ODP:** Simple Relation, with conditional source annotation.

**Question:** What can a saved game allow a player to do?  
**Answer:** Restart the game after losing all lives or after stopping play. [Source: videogame_cq_document_50.json, extracted lines 52–55]  
**Classes:** `Cl_SavedGame`, `Cl_VideoGame`, `Cl_Party`.  
**ODP:** Simple Relation, with restart-condition annotation.

**Question:** How does a heads-up display present gameplay information?  
**Answer:** Through an on-screen user interface overlaid on the rendered game. [Source: videogame_cq_document_50.json, extracted lines 58–61]  
**Classes:** `Cl_HeadsUpDisplay`, `Cl_OnScreenUserInterface`, `Cl_GameplayInformation`, `Cl_VisualOutput`.  
**ODP:** Simple Relation.

**Question:** What components make up a video game platform?  
**Answer:** Electronic components or computer hardware and associated software. [Source: videogame_cq_document_50.json, extracted lines 64–67]  
**Classes:** `Cl_VideoGamePlatform`, `Cl_PlatformComponent`, `Cl_Hardware`, `Cl_Software`.  
**ODP:** Partonymy/Meronymy.

**Question:** Which major platform-based categories of video games are identified in the document?  
**Answer:** Arcade video games, console games, computer games, mobile games, games for virtual and augmented reality systems, and cloud gaming. [Source: videogame_cq_document_50.json, extracted lines 70–73]  
**Classes:** `Cl_VideoGame`, `Cl_PlatformCategory`.  
**ODP:** Explicit Typing through relational classification values.

**Question:** How many platforms are video games typically designed for?  
**Answer:** Typically one or a limited number of platforms. [Source: videogame_cq_document_50.json, extracted lines 76–79]  
**Classes:** `Cl_VideoGame`, `Cl_VideoGamePlatform`.  
**ODP:** Simple Relation, with typicality annotation.

**Question:** What are games developed for platforms other than those originally intended called?  
**Answer:** Ports or conversions. [Source: videogame_cq_document_50.json, extracted lines 82–85]  
**Classes:** `Cl_VideoGame`, `Cl_VersionForm`, `Cl_VideoGamePlatform`.  
**ODP:** Explicit Typing through version-form values.

**Question:** How much of an original game's source code is reused in a remaster?  
**Answer:** Most of the original game's source code. [Source: videogame_cq_document_50.json, extracted lines 88–91]  
**Classes:** `Cl_VideoGame`, `Cl_VersionForm`, `Cl_SourceCode`.  
**ODP:** Simple Relation, with qualitative-extent annotation.

**Question:** How extensively is the original game reworked in a remake?  
**Answer:** The original game is significantly reworked, possibly from scratch. [Source: videogame_cq_document_50.json, extracted lines 94–97]  
**Classes:** `Cl_VideoGame`, `Cl_VersionForm`.  
**ODP:** Simple Relation, with reworking-extent annotation.

**Question:** What components are integrated into a handheld game console's single unit?  
**Answer:** The console, a small screen, speakers, and buttons, a joystick, or other game controllers. [Source: videogame_cq_document_50.json, extracted lines 100–103]  
**Classes:** `Cl_HandheldGameConsole`, `Cl_Console`, `Cl_BuiltInScreen`, `Cl_Speaker`, `Cl_GameController`.  
**ODP:** Partonymy/Meronymy.

**Question:** Which mobile-device features may support augmented reality gameplay?  
**Answer:** Features that may be used include accelerometers, global positioning information, and cameras. [Source: videogame_cq_document_50.json, extracted lines 106–109]  
**Classes:** `Cl_MobileDevice`, `Cl_Accelerometer`, `Cl_GlobalPositioningInformation`, `Cl_Camera`, `Cl_AugmentedRealityGameplay`.  
**ODP:** Simple Relation, with optional-use qualification.

**Question:** Where is a cloud game computed and rendered?  
**Answer:** On remote hardware provided by the cloud gaming provider. [Source: videogame_cq_document_50.json, extracted lines 112–115]  
**Classes:** `Cl_VideoGame`, `Cl_PlatformCategory`, `Cl_RemoteHardware`, `Cl_Party`.  
**ODP:** Simple Relation.

**Question:** What features does the head-mounted unit generally required for virtual reality games provide?  
**Answer:** Stereoscopic screens and motion tracking. [Source: videogame_cq_document_50.json, extracted lines 118–121]  
**Classes:** `Cl_VideoGame`, `Cl_PlatformCategory`, `Cl_HeadMountedUnit`, `Cl_StereoscopicScreen`, `Cl_MotionTracking`.  
**ODP:** Partonymy/Meronymy, with the VR requirement qualified.

**Question:** How does an emulator enable games from another system to run on a modern system?  
**Answer:** By simulating the original system's hardware in a virtual machine. [Source: videogame_cq_document_50.json, extracted lines 124–127]  
**Classes:** `Cl_Emulator`, `Cl_Hardware`, `Cl_VirtualMachine`, `Cl_VideoGamePlatform`, `Cl_VideoGame`.  
**ODP:** Simple Relation.

**Question:** How does backward compatibility typically enable older games to run on newer platforms?  
**Answer:** Typically, directly through the newer platform's hardware and built-in software. [Source: videogame_cq_document_50.json, extracted lines 130–133]  
**Classes:** `Cl_BackwardCompatibility`, `Cl_VideoGamePlatform`, `Cl_Hardware`, `Cl_Software`, `Cl_VideoGame`.  
**ODP:** Simple Relation, with typicality annotation.

**Question:** On which physical media formats can video games be distributed?  
**Answer:** ROM cartridges; magnetic storage such as magnetic tape and floppy discs; optical media such as CD-ROMs and DVDs; and flash memory cards. [Source: videogame_cq_document_50.json, extracted lines 136–139]  
**Classes:** `Cl_PhysicalGameMedia`, `Cl_ROMCartridge`, `Cl_MagneticStorage`, `Cl_MagneticTape`, `Cl_FloppyDisc`, `Cl_OpticalMedia`, `Cl_CDROM`, `Cl_DVD`, `Cl_FlashMemoryCard`.  
**ODP:** Taxonomy / Subclass.

**Question:** What forms of game extension can provide new content and software patches?  
**Answer:** Expansion packs and downloadable content. [Source: videogame_cq_document_50.json, extracted lines 142–145]  
**Classes:** `Cl_GameExtension`, `Cl_ExpansionPack`, `Cl_DownloadableContent`, `Cl_GameContent`, `Cl_SoftwarePatch`.  
**ODP:** Simple Relation.

**Question:** What changes can user-created modifications make to a game?  
**Answer:** They can alter the game or add to it. [Source: videogame_cq_document_50.json, extracted lines 148–151]  
**Classes:** `Cl_UserCreatedModification`, `Cl_VideoGame`, `Cl_Party`.  
**ODP:** Simple Relation.

**Question:** Which kinds of parties are involved in bringing a video game to consumers?  
**Answer:** Developers, publishers, distributors, retailers, hardware manufacturers, and other marketers. [Source: videogame_cq_document_50.json, extracted lines 154–157]  
**Classes:** `Cl_Party`, `Cl_VideoGame`, `Cl_Hardware`.  
**ODP:** Simple Relation using context-specific role properties.

**Question:** What do video game input devices translate into game input?  
**Answer:** Human actions. [Source: videogame_cq_document_50.json, extracted lines 160–163]  
**Classes:** `Cl_InputDevice`, `Cl_HumanAction`, `Cl_GameInput`.  
**ODP:** Simple Relation.

**Question:** Which specialized controllers may be used for certain game genres?  
**Answer:** Racing wheels, light guns, and dance pads may be used. [Source: videogame_cq_document_50.json, extracted lines 166–169]  
**Classes:** `Cl_SpecializedController`, `Cl_RacingWheel`, `Cl_LightGun`, `Cl_DancePad`, `Cl_GameGenre`.  
**ODP:** Taxonomy / Subclass, with optional-use qualification.

**Question:** What devices can display video game graphics?  
**Answer:** Televisions, built-in screens, projectors, and computer monitors. [Source: videogame_cq_document_50.json, extracted lines 172–175]  
**Classes:** `Cl_DisplayDevice`, `Cl_Television`, `Cl_BuiltInScreen`, `Cl_Projector`, `Cl_ComputerMonitor`, `Cl_VisualOutput`.  
**ODP:** Taxonomy / Subclass with a simple display relation.

**Question:** What kind of player feedback can haptic technology provide?  
**Answer:** Tactile sensations, such as a controller shaking in the player's hands. [Source: videogame_cq_document_50.json, extracted lines 178–181]  
**Classes:** `Cl_HapticTechnology`, `Cl_TactileFeedback`, `Cl_GameController`, `Cl_Party`.  
**ODP:** Simple Relation.

**Question:** What forms can a video game's visual output take?  
**Answer:** Fixed displays using LED or LCD elements, text-based output, two-dimensional graphics, three-dimensional graphics, and augmented reality displays. [Source: videogame_cq_document_50.json, extracted lines 184–187]  
**Classes:** `Cl_VideoGame`, `Cl_VisualOutput`, `Cl_VisualOutputForm`.  
**ODP:** Explicit Typing through output-form values.

**Question:** On what basis are video games generally assigned to genres?  
**Answer:** Video games are generally assigned to genres based on their gameplay interaction. [Source: videogame_cq_document_50.json, extracted lines 190–193]  
**Classes:** `Cl_VideoGame`, `Cl_GameGenre`, `Cl_PlayerInteraction`.  
**ODP:** Simple Relation, with general-basis and exception annotations.

**Question:** What subgenres of shooter games are described?  
**Answer:** First-person shooters and third-person shooters. [Source: videogame_cq_document_50.json, extracted lines 196–199]  
**Classes:** `Cl_ShooterGame`, `Cl_FirstPersonShooter`, `Cl_ThirdPersonShooter`.  
**ODP:** Taxonomy / Subclass.

**Question:** Can a cross-genre game type belong to multiple top-level genres?  
**Answer:** Yes. Cross-genre types such as action-adventure games can fall under multiple top-level genres. [Source: videogame_cq_document_50.json, extracted lines 202–205]  
**Classes:** `Cl_GameGenre`, `Cl_CrossGenreType`, `Cl_TopLevelGenre`.  
**ODP:** Simple Relation allowing multiple broader-genre values.

**Question:** What does a video game's mode describe?  
**Answer:** How many players can use the game at the same time. [Source: videogame_cq_document_50.json, extracted lines 208–211]  
**Classes:** `Cl_VideoGame`, `Cl_GameMode`.  
**ODP:** Simple Relation with a count-valued data property.

**Question:** What primary game-mode categories are distinguished by simultaneous player participation?  
**Answer:** Single-player and multiplayer games. [Source: videogame_cq_document_50.json, extracted lines 214–217]  
**Classes:** `Cl_VideoGame`, `Cl_GameMode`.  
**ODP:** Explicit Typing through mode values.

**Question:** In what device and network arrangements can multiplayer games be played?  
**Answer:** Locally on the same device, on separate devices connected through a local network, or online through separate Internet connections. [Source: videogame_cq_document_50.json, extracted lines 220–223]  
**Classes:** `Cl_GameMode`, `Cl_PlayArrangement`.  
**ODP:** Simple Relation between mode and available arrangement values.

**Question:** What gameplay styles can multiplayer games offer?  
**Answer:** Most are based on competitive gameplay, while many also offer cooperative, team-based, and asymmetric gameplay. [Source: videogame_cq_document_50.json, extracted lines 226–229]  
**Classes:** `Cl_GameMode`, `Cl_GameplayStyle`.  
**ODP:** Simple Relation, with prevalence qualifications.

**Question:** How much player interaction do zero-player games involve?  
**Answer:** Very limited interaction; the player may establish a starting state and then passively observe the game proceeding on its own. [Source: videogame_cq_document_50.json, extracted lines 232–235]  
**Classes:** `Cl_VideoGame`, `Cl_GameMode`, `Cl_PlayerInteraction`, `Cl_Party`.  
**ODP:** Simple Relation, with limited-interaction annotation.

**Question:** What learning and mastery commitment do core games typically require?  
**Answer:** They typically require a fair amount of time to learn and master. [Source: videogame_cq_document_50.json, extracted lines 238–241]  
**Classes:** `Cl_CoreGame`.  
**ODP:** Simple Relation, with qualitative-duration annotation.

**Question:** What design characteristics distinguish casual games?  
**Answer:** Ease of accessibility, simple-to-understand gameplay, and quickly grasped rule sets. [Source: videogame_cq_document_50.json, extracted lines 244–247]  
**Classes:** `Cl_CasualGame`, `Cl_DesignCharacteristic`.  
**ODP:** Simple Relation.

**Question:** What broad categories of educational games are described?  
**Answer:** Edutainment games and educational video games geared toward problem solving. [Source: videogame_cq_document_50.json, extracted lines 250–253]  
**Classes:** `Cl_EducationalGame`, `Cl_EdutainmentGame`, `Cl_EducationalVideoGame`.  
**ODP:** Taxonomy / Subclass.

**Question:** What game types are included among serious games?  
**Answer:** Educational games, fitness games, simulator games, advergames, and newsgames. [Source: videogame_cq_document_50.json, extracted lines 256–259]  
**Classes:** `Cl_SeriousGame`, `Cl_EducationalGame`, `Cl_FitnessGame`, `Cl_SimulatorGame`, `Cl_Advergame`, `Cl_Newsgame`.  
**ODP:** Taxonomy / Subclass.

**Question:** How can other purposes affect the entertainment factor in serious games?  
**Answer:** Other purposes may augment, overshadow, or eliminate the entertainment factor. [Source: videogame_cq_document_50.json, extracted lines 262–265]  
**Classes:** `Cl_SeriousGame`, `Cl_GamePurpose`.  
**ODP:** Simple Relation, with qualified entertainment-effect annotation.

**Question:** What player responses are art games designed to generate?  
**Answer:** Emotion and empathy. [Source: videogame_cq_document_50.json, extracted lines 268–271]  
**Classes:** `Cl_ArtGame`, `Cl_IntendedPlayerResponse`, `Cl_Party`.  
**ODP:** Simple Relation expressing intention.

**Question:** What information do nearly all video game content-rating systems provide?  
**Answer:** Nearly all systems provide a primary identifier based on minimum age, along with descriptors identifying specific content. [Source: videogame_cq_document_50.json, extracted lines 274–277]  
**Classes:** `Cl_ContentRatingSystem`, `Cl_MinimumAgeIdentifier`, `Cl_ContentDescriptor`.  
**ODP:** Simple Relation, with “nearly all” qualification.

**Question:** Which content themes can influence video game content ratings?  
**Answer:** Violence, including its type and graphic presentation; sexual content; drug and alcohol use; and gambling. [Source: videogame_cq_document_50.json, extracted lines 280–283]  
**Classes:** `Cl_ContentRating`, `Cl_ContentTheme`.  
**ODP:** Simple Relation, with content-review qualifications.

**Question:** Which organizations assign video game content ratings in the regions described in the document?  
**Answer:** ESRB: the United States.  PEGI: the United Kingdom, most of the European Union, and other European countries.  ACB: Australia.  CERO: Japan.  USK: Germany. [Source: videogame_cq_document_50.json, extracted lines 286–289]  
**Classes:** `Cl_ContentRatingOrganization`, `Cl_ContentRatingSystem`, `Cl_Region`.  
**ODP:** Explicit Typing with scoped regional relations.

**Question:** How are video game content-rating systems generally upheld?  
**Answer:** They are generally voluntary systems upheld by vendor practices, with regulations varying by country. [Source: videogame_cq_document_50.json, extracted lines 292–295]  
**Classes:** `Cl_ContentRatingSystem`, `Cl_ContentRatingOrganization`, `Cl_Region`.  
**ODP:** Simple Relation, with general-practice and exception annotations.

**Question:** What cross-region content-rating process does the International Age Rating Coalition support?  
**Answer:** Publishers can complete a content-rating review with one provider and use IARC to affirm content ratings for other regions. [Source: videogame_cq_document_50.json, extracted lines 298–301]  
**Classes:** `Cl_ContentRatingProcess`, `Cl_ContentRatingReview`, `Cl_CrossRegionRatingAffirmation`, `Cl_ContentRating`, `Cl_Party`, `Cl_Region`.  
**ODP:** Minimal Event/process context with direct role and dependency relations.
