import { routes } from "../../routes";
import { MdStore } from "react-icons/md";
import PublicIcon from "@mui/icons-material/Public";
import PolicyIcon from "@mui/icons-material/Policy";
import { MdManageHistory } from "react-icons/md";
import { SiGoogleanalytics } from "react-icons/si";
export const GOOGLE_MAP_LIBRARIES = ["places", "geometry", "drawing"];

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
  "Kalyan",
  "Malabar",
  "Joyalukkas",
  "PC Jeweller",
  "Reliance Jewels",
  "Bhima Jewellers",
  "Bluestone",
];

export const ourBrandList = [
  "Caratlane",
  "Tanishq",
  "Zoya",
  "Mia",
  "Titan Eye+",
  "Titan Eyeplus",
  "Titan World",
  "Titan World",
  "World of titan",
  "Fastrack",
  "Helios Watch",
  "Helios Watch",
  "Taneira sarees",
];

export const channel_list = [
  "WOT",
  "TANISHQ",
  "EYEWEAR",
  "FASTRACK",
  "HELIOS",
  "MIA",
];
