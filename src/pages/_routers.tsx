import DnsRoundedIcon from '@mui/icons-material/DnsRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import WifiRoundedIcon from '@mui/icons-material/WifiRounded'
import { createBrowserRouter, RouteObject } from 'react-router'

import HomeSvg from '@/assets/image/itemicon/home.svg?react'
import ProfilesSvg from '@/assets/image/itemicon/profiles.svg?react'
import ProxiesSvg from '@/assets/image/itemicon/proxies.svg?react'
import SettingsSvg from '@/assets/image/itemicon/settings.svg?react'

import Layout from './_layout'
import HomePage from './home'
import ProfilesPage from './profiles'
import ProxiesPage from './proxies'
import SettingsPage from './settings'

export const navItems = [
  {
    label: 'layout.components.navigation.tabs.home',
    path: '/',
    icon: [<HomeRoundedIcon key="mui" />, <HomeSvg key="svg" />],
    Component: HomePage,
  },
  {
    label: 'layout.components.navigation.tabs.proxies',
    path: '/proxies',
    icon: [<WifiRoundedIcon key="mui" />, <ProxiesSvg key="svg" />],
    Component: ProxiesPage,
  },
  {
    label: 'layout.components.navigation.tabs.profiles',
    path: '/profile',
    icon: [<DnsRoundedIcon key="mui" />, <ProfilesSvg key="svg" />],
    Component: ProfilesPage,
  },
  {
    label: 'layout.components.navigation.tabs.settings',
    path: '/settings',
    icon: [<SettingsRoundedIcon key="mui" />, <SettingsSvg key="svg" />],
    Component: SettingsPage,
  },
]

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: navItems.map(
      (item) =>
        ({
          path: item.path,
          Component: item.Component,
        }) as RouteObject,
    ),
  },
])
