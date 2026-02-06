/**
 * Auto-fix missing imports in generated code.
 *
 * The main use-case: AI-generated components reference PascalCase identifiers
 * (e.g. `<Bot />`, `<ChevronDown />`) without importing them.  This utility
 * detects those references and injects the correct `lucide-react` import at
 * the top of the file.
 *
 * The approach is intentionally conservative:
 *  1. Collect every PascalCase identifier used in JSX position (`<Foo`).
 *  2. Subtract identifiers that are already imported, declared locally, or
 *     are well-known globals / React built-ins.
 *  3. Of the remaining, keep only those whose names match a known Lucide icon.
 *  4. Inject one combined `import { … } from 'lucide-react';` statement.
 */

// --------------------------------------------------------------------------
// A comprehensive set of Lucide icon names (PascalCase).
// We intentionally keep this large so AI-generated code "just works".
// --------------------------------------------------------------------------
const LUCIDE_ICONS = new Set([
  "Activity","Airplay","AlarmClock","AlertCircle","AlertOctagon","AlertTriangle",
  "AlignCenter","AlignJustify","AlignLeft","AlignRight","Anchor","Aperture",
  "Archive","ArrowBigDown","ArrowBigLeft","ArrowBigRight","ArrowBigUp",
  "ArrowDown","ArrowDownCircle","ArrowDownLeft","ArrowDownRight","ArrowLeft",
  "ArrowLeftCircle","ArrowRight","ArrowRightCircle","ArrowUp","ArrowUpCircle",
  "ArrowUpDown","ArrowUpLeft","ArrowUpRight","Asterisk","AtSign","Award",
  "Axe","Baby","Backpack","Badge","BadgeCheck","BadgeDollarSign","BadgeHelp",
  "BadgeInfo","BadgeMinus","BadgePlus","BadgeX","BanknoteIcon","Banknote",
  "BarChart","BarChart2","BarChart3","BarChart4","BarChartHorizontal",
  "Battery","BatteryCharging","BatteryFull","BatteryLow","BatteryMedium",
  "BatteryWarning","Beaker","Bean","Bed","Beer","Bell","BellDot","BellMinus",
  "BellOff","BellPlus","BellRing","Bike","Binary","Bird","Bitcoin","Blinds",
  "Blocks","Bluetooth","BluetoothConnected","BluetoothOff","BluetoothSearching",
  "Bold","Bomb","Bone","Book","BookCopy","BookDown","BookKey","BookLock",
  "BookMarked","BookMinus","BookOpen","BookOpenCheck","BookOpenText","BookPlus",
  "BookText","BookType","BookUp","BookUser","BookX","Bookmark","BookmarkMinus",
  "BookmarkPlus","Bot","BotMessageSquare","Box","Boxes","Braces","Brackets",
  "Brain","BrainCircuit","BrainCog","Briefcase","BriefcaseBusiness",
  "BriefcaseMedical","BringToFront","Brush","Bug","Building","Building2",
  "Bus","Cable","Cake","Calculator","Calendar","CalendarCheck","CalendarClock",
  "CalendarDays","CalendarHeart","CalendarMinus","CalendarOff","CalendarPlus",
  "CalendarRange","CalendarSearch","CalendarX","Camera","CameraOff",
  "Candy","CandyCane","Car","Carrot","CaseLower","CaseSensitive","CaseUpper",
  "Cast","Castle","Cat","Check","CheckCheck","CheckCircle","CheckCircle2",
  "CheckSquare","ChefHat","Cherry","ChevronDown","ChevronFirst","ChevronLast",
  "ChevronLeft","ChevronRight","ChevronUp","ChevronsDown","ChevronsDownUp",
  "ChevronsLeft","ChevronsLeftRight","ChevronsRight","ChevronsRightLeft",
  "ChevronsUp","ChevronsUpDown","Chrome","Church","Cigarette","CigaretteOff",
  "Circle","CircleCheck","CircleDashed","CircleDot","CircleEllipsis",
  "CircleMinus","CircleOff","CirclePlus","CircleSlash","CircleUser","CircleX",
  "Citrus","Clapperboard","Clipboard","ClipboardCheck","ClipboardCopy",
  "ClipboardEdit","ClipboardList","ClipboardPaste","ClipboardSignature",
  "ClipboardType","ClipboardX","Clock","Clock1","Clock10","Clock11","Clock12",
  "Clock2","Clock3","Clock4","Clock5","Clock6","Clock7","Clock8","Clock9",
  "Cloud","CloudCog","CloudDrizzle","CloudFog","CloudHail","CloudLightning",
  "CloudMoon","CloudMoonRain","CloudOff","CloudRain","CloudRainWind",
  "CloudSnow","CloudSun","CloudSunRain","CloudUpload","Cloudy","Clover",
  "Club","Code","Code2","Codepen","Codesandbox","Coffee","Cog","Coins",
  "Columns","Combine","Command","Compass","Component","Computer","ConciergeBell",
  "Cone","Construction","Contact","Contact2","Container","Contrast","Cookie",
  "Copy","CopyCheck","CopyMinus","CopyPlus","CopySlash","CopyX","Copyleft",
  "Copyright","CornerDownLeft","CornerDownRight","CornerLeftDown","CornerLeftUp",
  "CornerRightDown","CornerRightUp","CornerUpLeft","CornerUpRight","Cpu",
  "CreditCard","Croissant","Crop","Cross","Crosshair","Crown","CupSoda",
  "Currency","Database","Delete","Dessert","Diamond","Dice1","Dice2","Dice3",
  "Dice4","Dice5","Dice6","Dices","Diff","Disc","Disc2","Disc3","Divide",
  "DivideCircle","DivideSquare","Dna","DnaOff","Dog","DollarSign","Donut",
  "Door","DoorClosed","DoorOpen","Dot","Download","DownloadCloud","Dribbble",
  "Droplet","Droplets","Drum","Drumstick","Dumbbell","Ear","EarOff","Eclipse",
  "Edit","Edit2","Edit3","Egg","EggFried","EggOff","Ellipsis",
  "EllipsisVertical","Equal","EqualNot","Eraser","Euro","Expand",
  "ExternalLink","Eye","EyeOff","Facebook","Factory","Fan","FastForward",
  "Feather","FerrisWheel","Figma","File","FileArchive","FileAudio",
  "FileAudio2","FileAxis3d","FileBadge","FileBadge2","FileBarChart",
  "FileBarChart2","FileBox","FileCheck","FileCheck2","FileClock","FileCode",
  "FileCode2","FileCog","FileDiff","FileDigit","FileDown","FileEdit",
  "FileHeart","FileImage","FileInput","FileJson","FileJson2","FileKey",
  "FileKey2","FileLock","FileLock2","FileMinus","FileMinus2","FileMusic",
  "FileOutput","FilePen","FilePenLine","FilePieChart","FilePlus","FilePlus2",
  "FileQuestion","FileScan","FileSearch","FileSearch2","FileSignature",
  "FileSpreadsheet","FileStack","FileSymlink","FileTerminal","FileText",
  "FileType","FileType2","FileUp","FileVideo","FileVideo2","FileVolume",
  "FileVolume2","FileWarning","FileX","FileX2","Files","Film","Filter",
  "FilterX","Fingerprint","FireExtinguisher","Fish","FishOff","FishSymbol",
  "Flag","FlagOff","FlagTriangleLeft","FlagTriangleRight","Flame",
  "FlameKindling","Flashlight","FlashlightOff","FlaskConical","FlaskConicalOff",
  "FlaskRound","FlipHorizontal","FlipHorizontal2","FlipVertical",
  "FlipVertical2","Flower","Flower2","Focus","Fold","FoldHorizontal",
  "FoldVertical","Folder","FolderArchive","FolderCheck","FolderClock",
  "FolderClosed","FolderCog","FolderDot","FolderDown","FolderEdit",
  "FolderGit","FolderGit2","FolderHeart","FolderInput","FolderKanban",
  "FolderKey","FolderLock","FolderMinus","FolderOpen","FolderOpenDot",
  "FolderOutput","FolderPen","FolderPlus","FolderRoot","FolderSearch",
  "FolderSearch2","FolderSymlink","FolderSync","FolderTree","FolderUp",
  "FolderX","Folders","Footprints","Forklift","Forward","Frame","Framer",
  "Frown","Fuel","Fullscreen","FunctionSquare","GalleryHorizontal",
  "GalleryHorizontalEnd","GalleryThumbnails","GalleryVertical",
  "GalleryVerticalEnd","Gamepad","Gamepad2","GanttChart","GanttChartSquare",
  "Gauge","GaugeCircle","Gavel","Gem","Ghost","Gift","GitBranch",
  "GitBranchPlus","GitCommit","GitCommitHorizontal","GitCommitVertical",
  "GitCompare","GitCompareArrows","GitFork","GitGraph","GitMerge",
  "GitPullRequest","GitPullRequestArrow","GitPullRequestClosed",
  "GitPullRequestCreate","GitPullRequestDraft","Github","Gitlab","GlassWater",
  "Glasses","Globe","Globe2","Goal","Grab","GraduationCap","Grape","Grid",
  "Grid2x2","Grid3x3","Grip","GripHorizontal","GripVertical","Group",
  "Guitar","Hammer","Hand","HandMetal","HandPlatter","Handshake","HardDrive",
  "HardDriveDownload","HardDriveUpload","HardHat","Hash","Haze","Hdmi",
  "Heading","Heading1","Heading2","Heading3","Heading4","Heading5","Heading6",
  "Headphones","Heart","HeartCrack","HeartHandshake","HeartOff","HeartPulse",
  "HeatWave","Heater","HelpCircle","Hexagon","Highlighter","History","Home",
  "Hop","HopOff","Hospital","Hotel","Hourglass","IceCream","IceCream2",
  "Image","ImageDown","ImageMinus","ImageOff","ImagePlus","Import","Inbox",
  "Indent","IndianRupee","Infinity","Info","InspectionPanel","Instagram",
  "Italic","IterationCcw","IterationCw","JapaneseYen","Joystick","Kanban",
  "Key","KeyRound","KeySquare","Keyboard","KeyboardMusic","Lamp",
  "LampCeiling","LampDesk","LampFloor","LampWallDown","LampWallUp",
  "LandPlot","Landmark","Languages","Laptop","Laptop2","Lasso","LassoSelect",
  "Laugh","Layers","Layers2","Layers3","Layout","LayoutDashboard","LayoutGrid",
  "LayoutList","LayoutPanelLeft","LayoutPanelTop","LayoutTemplate","Leaf",
  "LeafyGreen","Library","LibraryBig","LifeBuoy","Ligature","Lightbulb",
  "LightbulbOff","LineChart","Link","Link2","Link2Off","Linkedin","List",
  "ListChecks","ListCollapse","ListEnd","ListFilter","ListMinus","ListMusic",
  "ListOrdered","ListPlus","ListRestart","ListStart","ListTodo","ListTree",
  "ListVideo","ListX","Loader","Loader2","Locate","LocateFixed","LocateOff",
  "Lock","LockKeyhole","LockKeyholeOpen","LockOpen","LogIn","LogOut",
  "Lollipop","Luggage","MSquare","Magnet","Mail","MailCheck","MailMinus",
  "MailOpen","MailPlus","MailQuestion","MailSearch","MailWarning","MailX",
  "Mailbox","Mails","Map","MapPin","MapPinOff","MapPinned","Martini",
  "Maximize","Maximize2","Medal","Megaphone","MegaphoneOff","Meh","MemoryStick",
  "Menu","Merge","MessageCircle","MessageCircleCode","MessageCircleDashed",
  "MessageCircleHeart","MessageCircleMore","MessageCircleOff","MessageCirclePlus",
  "MessageCircleQuestion","MessageCircleReply","MessageCircleWarning",
  "MessageCircleX","MessageSquare","MessageSquareCode","MessageSquareDashed",
  "MessageSquareDiff","MessageSquareDot","MessageSquareHeart","MessageSquareMore",
  "MessageSquareOff","MessageSquarePlus","MessageSquareQuote","MessageSquareReply",
  "MessageSquareShare","MessageSquareText","MessageSquareWarning","MessageSquareX",
  "MessagesSquare","Mic","Mic2","MicOff","Microscope","Microwave","Milestone",
  "Milk","MilkOff","Minimize","Minimize2","Minus","MinusCircle","MinusSquare",
  "Monitor","MonitorCheck","MonitorDot","MonitorDown","MonitorOff","MonitorPause",
  "MonitorPlay","MonitorSmartphone","MonitorSpeaker","MonitorStop","MonitorUp",
  "MonitorX","Moon","MoonStar","MoreHorizontal","MoreVertical","Mountain",
  "MountainSnow","Mouse","MousePointer","MousePointer2","MousePointerClick",
  "Move","Move3d","MoveDiagonal","MoveDiagonal2","MoveDown","MoveDownLeft",
  "MoveDownRight","MoveHorizontal","MoveLeft","MoveRight","MoveUp","MoveUpLeft",
  "MoveUpRight","MoveVertical","Music","Music2","Music3","Music4",
  "Navigation","Navigation2","NavigationOff","Network","Newspaper","Nfc",
  "Notebook","NotebookPen","NotebookTabs","NotebookText","NotepadText",
  "NotepadTextDashed","Nut","NutOff","Octagon","OctagonAlert","OctagonX",
  "Option","Orbit","Outdent","Package","Package2","PackageCheck","PackageMinus",
  "PackageOpen","PackagePlus","PackageSearch","PackageX","PaintBucket",
  "Paintbrush","Paintbrush2","Palette","PalmTree","Palmtree","PanelBottom",
  "PanelBottomClose","PanelBottomDashed","PanelBottomOpen","PanelLeft",
  "PanelLeftClose","PanelLeftDashed","PanelLeftOpen","PanelRight",
  "PanelRightClose","PanelRightDashed","PanelRightOpen","PanelTop",
  "PanelTopClose","PanelTopDashed","PanelTopOpen","PanelsLeftBottom",
  "PanelsRightBottom","PanelsTopLeft","Paperclip","Parentheses","ParkingCircle",
  "ParkingCircleOff","ParkingMeter","ParkingSquare","ParkingSquareOff",
  "PartyPopper","Pause","PauseCircle","PauseOctagon","PawPrint","PcCase",
  "Pen","PenLine","PenSquare","PenTool","Pencil","PencilLine","PencilRuler",
  "Pentagon","Percent","PersonStanding","Phone","PhoneCall","PhoneForwarded",
  "PhoneIncoming","PhoneMissed","PhoneOff","PhoneOutgoing","Pi","Piano",
  "Pickaxe","PictureInPicture","PictureInPicture2","PiggyBank","Pilcrow",
  "PilcrowSquare","Pill","Pin","PinOff","Pipette","Pizza","Plane",
  "PlaneLanding","PlaneTakeoff","Play","PlayCircle","PlaySquare","Plug",
  "Plug2","PlugZap","PlugZap2","Plus","PlusCircle","PlusSquare","Pocket",
  "PocketKnife","Podcast","Pointer","Popcorn","Popsicle","PoundSterling",
  "Power","PowerOff","Presentation","Printer","Projector","Puzzle","QrCode",
  "Quote","Rabbit","Radar","Radiation","Radio","RadioReceiver","RadioTower",
  "Rainbow","Rat","Ratio","Receipt","ReceiptCent","ReceiptEuro",
  "ReceiptIndianRupee","ReceiptJapaneseYen","ReceiptPoundSterling",
  "ReceiptRussianRuble","ReceiptSwissFranc","ReceiptText","RectangleEllipsis",
  "RectangleHorizontal","RectangleVertical","Recycle","Redo","Redo2",
  "RefreshCcw","RefreshCcwDot","RefreshCw","RefreshCwOff","Refrigerator",
  "Regex","RemoveFormatting","Repeat","Repeat1","Repeat2","Replace",
  "ReplaceAll","Reply","ReplyAll","Rewind","Ribbon","Rocket","RockingChair",
  "RollerCoaster","Rotate3d","RotateCcw","RotateCw","Route","RouteOff",
  "Router","Rows","Rows2","Rows3","Rows4","Rss","Ruler","RussianRuble",
  "Sailboat","Salad","Sandwich","Satellite","SatelliteDish","Save","SaveAll",
  "Scale","Scale3d","Scaling","Scan","ScanBarcode","ScanEye","ScanFace",
  "ScanLine","ScanSearch","ScanText","ScatterChart","School","School2",
  "Scissors","ScissorsLineDashed","ScissorsSquare","ScissorsSquareDashed",
  "ScreenShare","ScreenShareOff","Scroll","ScrollText","Search","SearchCheck",
  "SearchCode","SearchSlash","SearchX","Send","SendHorizontal","SeparatorHorizontal",
  "SeparatorVertical","Server","ServerCog","ServerCrash","ServerOff","Settings",
  "Settings2","Shapes","Share","Share2","Sheet","Shell","Shield","ShieldAlert",
  "ShieldBan","ShieldCheck","ShieldEllipsis","ShieldHalf","ShieldMinus",
  "ShieldOff","ShieldPlus","ShieldQuestion","ShieldX","Ship","ShipWheel",
  "Shirt","ShoppingBag","ShoppingBasket","ShoppingCart","Shovel","ShowerHead",
  "Shrink","Shrub","Shuffle","Sidebar","SidebarClose","SidebarOpen","Sigma",
  "Signal","SignalHigh","SignalLow","SignalMedium","SignalZero","Signpost",
  "SignpostBig","Siren","SkipBack","SkipForward","Skull","Slack","Slash",
  "Slice","Sliders","SlidersHorizontal","Smartphone","SmartphoneCharging",
  "SmartphoneNfc","Smile","SmilePlus","Snail","Snowflake","Sofa","SortAsc",
  "SortDesc","Soup","Space","Spade","Sparkle","Sparkles","Speaker","Speech",
  "SpellCheck","SpellCheck2","Spline","Split","SprayCan","Sprout","Square",
  "SquareActivity","SquareArrowDown","SquareArrowDownLeft","SquareArrowDownRight",
  "SquareArrowLeft","SquareArrowOutDownLeft","SquareArrowOutDownRight",
  "SquareArrowOutUpLeft","SquareArrowOutUpRight","SquareArrowRight",
  "SquareArrowUp","SquareArrowUpLeft","SquareArrowUpRight","SquareAsterisk",
  "SquareCheck","SquareCheckBig","SquareCode","SquareDashedBottom",
  "SquareDashedBottomCode","SquareDot","SquareEqual","SquareFunction",
  "SquareGanttChart","SquareKanban","SquareLibrary","SquareM","SquareMenu",
  "SquareMinus","SquareMousePointer","SquareParking","SquareParkingOff",
  "SquarePen","SquarePercent","SquarePi","SquarePlay","SquarePlus",
  "SquarePower","SquareRadical","SquareSigma","SquareSlash","SquareSplitHorizontal",
  "SquareSplitVertical","SquareStack","SquareTerminal","SquareUser",
  "SquareUserRound","SquareX","Squircle","Squirrel","Stamp","Star",
  "StarHalf","StarOff","StepBack","StepForward","Stethoscope","Sticker",
  "StickyNote","Store","StretchHorizontal","StretchVertical","Strikethrough",
  "Subscript","Sun","SunDim","SunMedium","SunMoon","SunSnow","Sunrise",
  "Sunset","Superscript","SwatchBook","SwissFranc","SwitchCamera","Sword",
  "Swords","Syringe","Table","Table2","TableProperties","Tablet",
  "TabletSmartphone","Tablets","Tag","Tags","Tally1","Tally2","Tally3",
  "Tally4","Tally5","Tangent","Target","Telescope","Tent","TentTree",
  "Terminal","TerminalSquare","TestTube","TestTube2","TestTubes","Text",
  "TextCursor","TextCursorInput","TextQuote","TextSearch","TextSelect",
  "Theater","Thermometer","ThermometerSnowflake","ThermometerSun","ThumbsDown",
  "ThumbsUp","Ticket","TicketCheck","TicketMinus","TicketPercent","TicketPlus",
  "TicketSlash","TicketX","Timer","TimerOff","TimerReset","ToggleLeft",
  "ToggleRight","Tornado","Torus","Touchpad","TouchpadOff","TowerControl",
  "ToyBrick","Tractor","TrafficCone","Train","TrainFront","TrainFrontTunnel",
  "TrainTrack","TramFront","Trash","Trash2","TreeDeciduous","TreePalm",
  "TreePine","Trees","Trello","TrendingDown","TrendingUp","Triangle",
  "TriangleAlert","TriangleRight","Trophy","Truck","Turtle","Tv","Tv2",
  "Twitch","Twitter","Type","Umbrella","UmbrellaOff","Underline","Undo",
  "Undo2","UnfoldHorizontal","UnfoldVertical","Ungroup","University","Unlink",
  "Unlink2","Unplug","Upload","UploadCloud","Usb","User","User2","UserCheck",
  "UserCheck2","UserCircle","UserCircle2","UserCog","UserCog2","UserMinus",
  "UserMinus2","UserPen","UserPlus","UserPlus2","UserRound","UserRoundCheck",
  "UserRoundCog","UserRoundMinus","UserRoundPen","UserRoundPlus",
  "UserRoundSearch","UserRoundX","UserSearch","UserX","UserX2","Users",
  "Users2","UsersRound","Utensils","UtensilsCrossed","UtilityPole","Variable",
  "Vault","Vegan","VenetianMask","Vibrate","VibrateOff","Video","VideoOff",
  "Videotape","View","Voicemail","Volume","Volume1","Volume2","VolumeX",
  "Vote","Wallet","Wallet2","WalletCards","WalletMinimal","Wallpaper","Wand",
  "Wand2","Warehouse","WashingMachine","Watch","Waves","Waypoints","Webcam",
  "Webhook","Weight","Wheat","WheatOff","WholeWord","Wifi","WifiOff","Wind",
  "Wine","WineOff","Workflow","Worm","WrapText","Wrench","X","XCircle",
  "XOctagon","XSquare","Youtube","Zap","ZapOff","ZoomIn","ZoomOut",
]);

// Identifiers to never auto-import (built-ins, React, HTML, etc.)
const IGNORE_IDENTIFIERS = new Set([
  // React built-ins
  "React","ReactDOM","Fragment","Suspense","StrictMode","Component",
  "PureComponent","Children","Profiler","ErrorBoundary",
  // Common JSX wrapper components that aren't icons
  "App","Provider","Router","Route","Routes","Switch","Link","NavLink",
  "Outlet","Navigate","BrowserRouter","HashRouter","MemoryRouter",
  // HTML-like but PascalCase (custom components the user likely defines)
  "Header","Footer","Main","Section","Nav","Aside","Article",
  // Animation
  "AnimatePresence","MotionDiv",
]);

/**
 * Scan source code for PascalCase JSX elements that are not imported or
 * locally defined, then return the list of icon names that should be
 * imported from lucide-react.
 */
export function detectMissingLucideImports(code: string): string[] {
  // 1. Collect all PascalCase identifiers used as JSX elements
  //    Matches: <IconName, <IconName>, <IconName />, <IconName\

  const jsxUsageRe = /<([A-Z][A-Za-z0-9]+)[\s/>]/g;
  const usedComponents = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = jsxUsageRe.exec(code)) !== null) {
    usedComponents.add(m[1]);
  }

  if (usedComponents.size === 0) return [];

  // 2. Collect already-imported identifiers
  const importedNames = new Set<string>();
  // Named imports:  import { A, B as C } from '...'
  const namedImportRe = /import\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g;
  while ((m = namedImportRe.exec(code)) !== null) {
    const names = m[1].split(",").map((n) => {
      const parts = n.trim().split(/\s+as\s+/);
      return (parts[1] || parts[0]).trim();
    });
    names.forEach((n) => n && importedNames.add(n));
  }
  // Default imports:  import Foo from '...'
  const defaultImportRe = /import\s+([A-Z]\w+)\s+from\s*['"][^'"]+['"]/g;
  while ((m = defaultImportRe.exec(code)) !== null) {
    importedNames.add(m[1]);
  }
  // Namespace imports: import * as Foo from '...'
  const nsImportRe = /import\s*\*\s*as\s+(\w+)\s+from\s*['"][^'"]+['"]/g;
  while ((m = nsImportRe.exec(code)) !== null) {
    importedNames.add(m[1]);
  }

  // 3. Collect locally-defined PascalCase identifiers
  //    const Foo = ..., function Foo(...), class Foo
  const localDefRe = /(?:const|let|var|function|class)\s+([A-Z]\w+)/g;
  while ((m = localDefRe.exec(code)) !== null) {
    importedNames.add(m[1]);
  }

  // 4. Filter: keep only icons that are used, not already imported,
  //    not in the ignore list, and ARE in the Lucide set.
  const missing: string[] = [];
  for (const name of usedComponents) {
    if (importedNames.has(name)) continue;
    if (IGNORE_IDENTIFIERS.has(name)) continue;
    if (LUCIDE_ICONS.has(name)) {
      missing.push(name);
    }
  }

  return missing.sort();
}

/**
 * Given source code, detect missing lucide-react icon imports and prepend
 * the import statement.  Returns the (possibly modified) code.
 */
export function autoFixMissingImports(code: string): string {
  const missing = detectMissingLucideImports(code);
  if (missing.length === 0) return code;

  // Check if there's already a lucide-react import we can extend
  const existingLucideImport = code.match(
    /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/
  );

  if (existingLucideImport) {
    // Extend the existing import
    const existingNames = existingLucideImport[1]
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    const allNames = [...new Set([...existingNames, ...missing])].sort();
    const newImport = `import { ${allNames.join(", ")} } from 'lucide-react'`;
    return code.replace(existingLucideImport[0], newImport);
  }

  // Prepend a new import
  const importLine = `import { ${missing.join(", ")} } from 'lucide-react';\n`;
  return importLine + code;
}
