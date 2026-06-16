import { routes } from "../../routes";
import { MdStore } from "react-icons/md";
import PublicIcon from "@mui/icons-material/Public";
import PolicyIcon from "@mui/icons-material/Policy";
import { MdManageHistory } from "react-icons/md";
import { SiGoogleanalytics } from "react-icons/si";
export const GOOGLE_MAP_LIBRARIES = ["places", "geometry", "drawing"];

export const DRIVE_TIME_RADIUS_MAP = {
  15: 3000,
  30: 5000,
  45: 8000,
};

export const MapContent = {
  disableDefaultUI: true,
  mapTypeControl: false,
  zoomControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  gestureHandling: "greedy",
};

export const menuItem = [
  {
    path: routes.NEW_STORE,
    name: "New Store Existing City",
    icon: <MdStore />,
  },
  {
    path: routes.DARK_CATCHMENT,
    name: "White Spaces Analysis",
    icon: <PolicyIcon />,
  },
  {
    path: routes.NEW_CITY_EXPANSION,
    name: "New City Expansion",
    icon: <PublicIcon />,
  },
  {
    path: routes.STORE_CATCHMENT_ANALYSIS,
    name: "Store Catchment Analysis",
    icon: <SiGoogleanalytics />,
  },
  {
    path: routes.HISTORY,
    name: "Projection History",
    icon: <MdManageHistory />,
  },
];

export const HardCodeData = {
  driveTime: [15, 30, 45],
};

export const colorPairs = [
  ["#ffd3a4", "#e27411"],
  ["#bad9f6", "#3e6e9c"],
  ["#ffdfb2", "#f28621"],
  ["#b9e2b6", "#2d6e25"],
  ["#f7e08a", "#b59412"],
  ["#b9d9d7", "#227170"],
  ["#ffb6bd", "#d63840"],
  ["#d1d1d1", "#706a68"],
  ["#ffcbe0", "#b83675"],
  ["#dab9d9", "#77517f"],
  ["#ead6c8", "#7b5033"],
  ["#b8d6f4", "#375f8f"],
];

export const comList = [
  "Kalyan Jewellers",
  "Malabar Jewellers",
  "Joyalukkas Jewellers",
  "PC Jewellers",
  "Reliance Jewellers",
  "Bhima Jewellers",
  "Bluestone",
  "Lalitha Jewellers",
  "Lalita Jewellers",
  "Krishniah Chetty Jewellers",
  "Senco Jewellers",
  "Indriya Jewellers",
  "Melorra Jewellers",
  "Giva Jewellers",
  "GRT Jewellers",
  "Agrawal Jewellers",
  "Ranka Jewellers",
  "PNG Jewellers",
  "TBZ Jewellers",
  "Hazoorilal Jewellers",
  "Khanna Jewellers",
  "PC Chandra Jewellers",
  "MP Jewellers",
  "DP Abhushan Jewellers",
  "Anopchand Tilokchand Jewellers",
];

// Used for Google nearbySearch keyword — full descriptive phrases get better results.
export const ourBrandList = [
  "Caratlane Jewelery",
  "Tanishq Jewelery",
  "Zoya Jewelery",
  "Mia Jewelery",
  "Titan Eye+",
  "Titan Eyeplus",
  "Titan World watches",
  "World of titan watches",
  "Fastrack watches",
  "Fastrack sunglases",
  "Fastrack eyewear",
  "Helios watches",
  "Taneira Sarees",
];

// Core brand names used to filter returned place titles.
// Separate from ourBrandList so Google search phrases don't break title matching.
export const ourBrandMatchList = [
  "Caratlane",
  "Tanishq",
  "Zoya",
  "Mia",
  "Titan Eye",
  "Titan World",
  "World of Titan",
  "Fastrack",
  "Helios",
  "Taneira",
];

// Core competitor names used to filter returned place titles.
export const comMatchList = [
  "Kalyan Jewel",
  "Malabar Jewel",
  "Joyalukkas Jewel",
  "PC Jewel",
  "Reliance Jewel",
  "Bhima Jewel",
  "Bluestone Jewel",
  "Lalitha Jewel",
  "Lalita Jewel",
  "Krishniah Chetty Jewel",
  "Senco Jewel",
  "Indriya Jewel",
  "Melorra Jewel",
  "Giva Jewel",
  "GRT Jewel",
  "Agrawal Jewel",
  "Ranka Jewel",
  "PNG Jewel",
  "TBZ Jewel",
  "Hazoorilal Jewel",
  "Khanna Jewel",
  "PC Chandra Jewel",
  "MP Jewel",
  "DP Abhushan Jewel",
  "Anopchand Tilokchand Jewel",
];

export const channel_list = [
  "WOT",
  "TANISHQ",
  "EYEWEAR",
  "FASTRACK",
  "HELIOS",
  "MIA",
];
