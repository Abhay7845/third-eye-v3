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

export const pdf_data = {
  assessment: {
    footfallAssessment: [
      "The presence of major IT parks like Infosys, Wipro, and Hewlett Packard Enterprise in Phase 1 and Phase 2 drives a high density of corporate professionals with substantial disposable incomes, creating a lucrative target market for contemporary and lightweight jewellery.",
      "Heavy weekday footfall is anchored around the Neeladri Road corridor, where tech employees gather during lunch and evening hours, making it a key destination for impulse and casual jewellery purchases.",
      "Weekend footfall patterns shift dramatically to families residing in large residential complexes like Prestige Sunrise Park, Ajmera Infinity, and Shriram Signiaa, leading to increased traffic for wedding and high-ticket gold jewellery shopping.",
      "The newly constructed M5 Ecity Mall on Hosur Road serves as a major crowd-puller, acting as a lifestyle hub that funnels high-intent shoppers directly to premium and aspirational retail brands like Mia by Tanishq located within.",
      "The massive influx of young, upwardly mobile couples and working women aged 25 to 40 in this pincode increases the demand for daily wear, minimalist platinum, and certified diamond jewellery over traditional heavy gold ornaments.",
      "Transit points such as the Electronic City Metro Station on the Yellow Line and the Elevated Expressway toll plazas facilitate seamless regional connectivity, drawing in floating shoppers from nearby areas like Bommasandra, Chandapura, and Singasandra.",
      "Festive seasons such as Dhanteras, Diwali, Akshaya Tritiya and local wedding seasons generate intense surges in footfall, requiring stores to optimize inventory and operational staff to handle high-density, high-intent purchasing crowds.",
      "The highly educated, cosmopolitan demographic prefers a structured, experiential in-store shopping journey, resulting in higher dwell times typically 30 to 45 minutes compared to traditional, unorganized silver or imitation jewellery shops.",
    ],
    competitionAssessment: [
      "Established corporate giants like Tanishq located on Neeladri Main Road dominate the high-value gold and diamond segments, benefiting from immense brand equity, certified purity guarantees, and aggressive local marketing campaigns.",
      "Niche brand players such as Mia by Tanishq and CaratLane cater to the massive millennial demand for modern, lightweight, and pocket-friendly daily wear designs, posing high direct competition in the sub-50,000 INR price point.",
      "Traditional and heritage brands such as Joyalukkas and Kalyan Jewellers represent strong competition for bridal and wedding shoppers, drawing high-volume transactions with their extensive collections of traditional South Indian designs.",
      "The presence of regional, unorganized local jewellers in the surrounding villages of Doddathogur, Kammasandra, and Gollahalli creates a highly fragmented market for silver products, basic gold exchanges, and low-making-charge daily items.",
      "Online-first D2C jewellery brands like Giva, Melorra, and BlueStone pose a persistent digital threat, capturing a significant portion of the tech-savvy demographic who prefer convenience and home delivery over physical retail experiences.",
      "The rising trend of imitation and antique jewellery rentals from local providers servicing Electronic City weddings presents indirect competition by absorbing budget-conscious wedding and festive consumers who avoid buying heavy bridal sets.",
      "Competitive strategies must emphasize superior customer services, such as private bridal styling lounges, customized made-to-order CAD designs, and transparent old-gold exchange policies, to effectively counter established giants.",
      "A high density of lifestyle and apparel outlets on Neeladri Road like Pantaloons, Trends, and Max works symbiotically, as fashion shoppers can be easily cross-targeted for fast-fashion or semi-precious daily jewellery collections.",
    ],
    commercialRentalAssessment: [
      "Premium high-street retail zones like Neeladri Main Road command high rental rates ranging from 120 to 180 INR per sq ft per month, reflecting the prime visibility and high-density customer footfall in Phase 1.",
      "Commercial spaces inside prime organized developments like M5 Ecity Mall command a rental premium, often starting at 200 to 250 INR per sq ft, frequently coupled with revenue-sharing or minimum guarantee clauses.",
      "Secondary commercial roads such as Bettadasanapura Main Road and Doddathogur Main Road offer budget-friendly alternatives with rentals starting from 60 to 90 INR per sq ft, suitable for boutique, design-led, or silver-specialty jewellery stores.",
      "Security deposit structures are standard for Bangalore's retail sector, typically requiring an upfront payment of 6 to 10 months of monthly rent, creating a substantial initial capital expenditure requirement for new jewellers.",
      "Large-format corporate showrooms require carpet areas between 2,500 and 5,000 sq ft, which translates to a monthly rental expenditure of 3,00,000 to 6,00,000 INR in prime Neeladri Nagar locations, requiring high ticket-size conversions.",
      "A standard lock-in period of 3 to 5 years is typically demanded by commercial landlords in Electronic City to ensure business stability, with escalation clauses ranging between 5% and 8% annually or 15% every 3 years.",
      "Landlords in the 560100 pincode often require commercial tenants to pay separate maintenance charges ranging from 5 to 15 INR per sq ft to cover common area upkeep, security, and power backup.",
      "Tenants can negotiate favourable rent-free fit-out periods of 45 to 90 days, which is critical for jewellery showrooms that require complex, high-security interior setups, armored vaults, and premium lighting systems.",
    ],
    frontageVisibilityAssessment: [
      "Prominent road-facing frontage of at least 25 to 30 feet is an absolute prerequisite on Neeladri Main Road to compete with the massive, illuminated facades of established players like Tanishq.",
      "Double-height ceilings and floor-to-ceiling glass facades are highly recommended for premium visibility, allowing high-income IT professionals commuting via cars or cabs to easily spot the store's interior layout and merchandise.",
      "The Electronic City elevated flyover and heavy metro pillars can create blind spots for ground-level shops on Hosur Road, making deep, well-lit, high-rise signage crucial for catching the attention of fast-moving vehicular traffic.",
      "Due to severe evening traffic congestion on the main avenues, high-quality, LED-backlit or dynamic digital signage with clear brand logos is essential to leverage the slow-moving gridlock into captive visual impressions.",
      "The entrance must feature clean, unobstructed sightlines from the street, avoiding any blocking by local street vendors, electrical transformers, or haphazardly parked two-wheelers, which are common issues in Doddathogur cross.",
      "Dedicated, well-curated window display areas facing the street are vital to showcase seasonal, wedding, or festive collections, enticing walk-ins from casual pedestrian traffic during high-footfall evening hours.",
      "Since a significant portion of target consumers commute on foot or via office cabs, having highly visible side-signage perpendicular to the road ensures readability from both pedestrian sidewalks and vehicles.",
      "Ensuring compliance with local BBMP signboards and language regulations such as the 60% Kannada language requirement on commercial boards is vital to avoid sudden legal penalties or disruption in store operations.",
    ],
    retailMaturity: [
      "The 560100 pincode is characterized by a Mature-Developing retail ecosystem, transitioning rapidly from an industrial-tech zone into a self-sustained residential and organized commercial micro-market.",
      "Consumer behavior in Electronic City is highly sophisticated, with a preference for certified purity such as BIS Hallmarked 22K or 18K gold and international grading standards like GIA or IGI for diamonds, leaving little room for uncertified local jewellers.",
      "The presence of premium anchor stores, supermarkets, luxury salons, and lifestyle malls indicates that the local populace is highly accustomed to high-end, organized retail experiences and expects matching store aesthetics.",
      "Digital and omnichannel maturity is exceptionally high; local shoppers heavily rely on Google Maps, social media previews, online appointment bookings, and virtual try-ons before physically visiting a jewellery showroom.",
      "The demographic's high financial literacy translates to a strong interest in gold investment schemes, systematic investment plans for precious metals, and digital gold, which stores must offer to capture recurring revenues.",
      "High demand for sustainable, ethical, and lab-grown diamonds reflects a modern retail mindset, indicating that any new store should dedicate shelf space to eco-friendly or alternative luxury product lines.",
      "Excellent infrastructure, including the elevated metro line, wide main roads, and organized multi-level parking setups in commercial buildings, supports a hassle-free shopping journey, which is crucial for high-ticket purchases.",
      "The market has reached a state of stable retail saturation in Phase 1, suggesting that any new jewellery brand must offer clear USPs, such as zero-deduction old-gold exchange or bespoke hand-crafted customization, to win market share.",
    ],
  },
  status: "SUCCESS",
};

export const formatAssessmentData = (assessment = {}) => {
  return Object.entries(assessment).map(([section, items]) => ({
    title: section
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase()),
    points: items,
  }));
};

export function getKeyAndValue(value) {
  const key = Object.keys(DRIVE_TIME_RADIUS_MAP).find(
    (key) => DRIVE_TIME_RADIUS_MAP[key] === value,
  );
  return key
    ? {
        key: Number(key),
        value: DRIVE_TIME_RADIUS_MAP[key],
      }
    : null;
}
