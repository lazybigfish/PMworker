import { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    colorBgLayout: '#f0f2f5',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#001529',
    },
    Menu: {
      itemBg: '#001529',
      subMenuItemBg: '#000c17',
      itemColor: 'rgba(255, 255, 255, 0.65)',
      itemSelectedColor: '#ffffff',
      itemSelectedBg: '#1890ff',
    },
    Card: {
      borderRadiusLG: 8,
    }
  },
};
