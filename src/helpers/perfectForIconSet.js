// Fixed icon-set for the "Who is it for?" free-text + icon system.
// Every icon is stored in the DB as a "library:ComponentName" string (see perfectForSuggestionModel.js).
// This map is the only place that resolves that string back to an actual React component,
// both for rendering saved suggestions and for populating the "Browse more" icon grid.

import {
  FaBriefcase,
  FaUserCircle,
  FaUsers,
  FaBuilding,
  FaPlane,
  FaGraduationCap,
  FaSchool,
  FaBook,
  FaUtensils,
  FaCoffee,
  FaStore,
  FaShoppingBag,
  FaTruck,
  FaPills,
} from 'react-icons/fa';

import {
  MdBusiness,
  MdSchool,
  MdComputer,
  MdPerson,
  MdMenuBook,
  MdLanguage,
} from 'react-icons/md';

import { PiBowlFoodLight } from 'react-icons/pi';
import { RiFirstAidKitFill } from 'react-icons/ri';

import {
  Store,
  PackageOpen,
  ShoppingCart,
  Shirt,
  Smartphone,
  Sofa,
  Scissors,
  Stethoscope,
  GraduationCap,
  Zap,
  Wrench,
  Home,
  Dumbbell,
  BadgePercent,
  Package,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
  Flower,
  Activity,
  BookOpen,
  Video,
  MonitorPlay,
  Building,
  Briefcase,
  Recycle,
  ListChecks,
  HeartHandshake,
} from 'lucide-react';

const iconLibraries = {
  fa: {
    FaBriefcase,
    FaUserCircle,
    FaUsers,
    FaBuilding,
    FaPlane,
    FaGraduationCap,
    FaSchool,
    FaBook,
    FaUtensils,
    FaCoffee,
    FaStore,
    FaShoppingBag,
    FaTruck,
    FaPills,
  },
  md: {
    MdBusiness,
    MdSchool,
    MdComputer,
    MdPerson,
    MdMenuBook,
    MdLanguage,
  },
  pi: {
    PiBowlFoodLight,
  },
  ri: {
    RiFirstAidKitFill,
  },
  lucide: {
    Store,
    PackageOpen,
    ShoppingCart,
    Shirt,
    Smartphone,
    Sofa,
    Scissors,
    Stethoscope,
    GraduationCap,
    Zap,
    Wrench,
    Home,
    Dumbbell,
    BadgePercent,
    Package,
    ShoppingBag,
    Truck,
    UtensilsCrossed,
    Flower,
    Activity,
    BookOpen,
    Video,
    MonitorPlay,
    Building,
    Briefcase,
    Recycle,
    ListChecks,
    HeartHandshake,
  },
};

export const DEFAULT_PERFECT_FOR_ICON = 'lucide:Store';

// Resolves a "library:ComponentName" string to its React component.
// Falls back to the default icon if the string doesn't match anything in the set.
export function resolvePerfectForIcon(iconKey) {
  if (!iconKey || typeof iconKey !== 'string') {
    return iconLibraries.lucide.Store;
  }
  const [library, name] = iconKey.split(':');
  return iconLibraries[library]?.[name] || iconLibraries.lucide.Store;
}

// Flat list of every available { key, Icon } pair, for the "Browse more" picker grid.
export const perfectForIconList = Object.entries(iconLibraries).flatMap(([library, icons]) =>
  Object.entries(icons).map(([name, Icon]) => ({
    key: `${library}:${name}`,
    Icon,
  }))
);
