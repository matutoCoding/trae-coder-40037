export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/production/index',
    'pages/reports/index',
    'pages/mine/index',
    'pages/feeding-detail/index',
    'pages/melting-detail/index',
    'pages/furnace-detail/index',
    'pages/casting-detail/index',
    'pages/rolling-detail/index',
    'pages/pickling-detail/index',
    'pages/inspection-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#B87333',
    navigationBarTitleText: '铜杆连铸管理',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#B87333',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '生产看板'
      },
      {
        pagePath: 'pages/production/index',
        text: '生产作业'
      },
      {
        pagePath: 'pages/reports/index',
        text: '数据报表'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
