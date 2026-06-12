const messages = {
  'app.tagline': '存入一切，随时召回',

  'auth.loginPrompt': '请登录',
  'auth.logout': '退出登录',
  'auth.logoutSuccess': '已退出登录',
  'auth.sessionExpired': '登录已失效，请重新登录',

  'login.username': '账号',
  'login.usernamePlaceholder': '请输入用户名',
  'login.password': '密码',
  'login.passwordPlaceholder': '请输入密码',
  'login.submit': '登录',
  'login.success': '登录成功',
  'login.hint': '登录后即可存入与召回你的记忆',
  'login.error': '用户名或密码错误',
  'login.errorNetwork': '无法连接服务器，请确认后端已启动',

  'nav.chat': '对话',
  'nav.documents': '文档',
  'nav.history': '历史记录',
  'nav.recentChats': '最近对话',

  'chat.title': '对话',
  'chat.subtitle': '优先检索你的文档，也支持日常问答',
  'chat.placeholder': '问待办、笔记内容，或任何日常问题…',
  'chat.send': '发送',
  'chat.loading': '正在检索并生成回答…',
  'chat.mockReply': '这是模拟回答。接入后端后，将基于你的文档内容生成真实回复。',

  'documents.title': '我的文档',
  'documents.subtitle': '管理你上传的文档记忆',
  'documents.upload': '上传文档',
  'documents.deleteAria': '删除文档',
  'documents.empty': '暂无文档，点击「上传文档」添加你的第一份记忆',
  'documents.loadError': '加载文档失败',
  'documents.uploadSuccess': '文档上传成功',
  'documents.uploadError': '文档上传失败',
  'documents.deleteSuccess': '文档已删除',
  'documents.deleteError': '删除文档失败',
  'documents.acceptHint': '.txt、.md、.pdf、.doc、.docx、.json、.xml、.csv、.xlsx',

  'history.title': '历史记录',
  'history.subtitle': '查看过去的对话记录',

  'upload.title': '上传文件',
  'upload.dropzoneHint': '点击选择文件，或拖拽到此处',
  'upload.confirm': '上传',
  'upload.cancel': '取消',
  'upload.selected': '已选择：',
  'upload.acceptFormats': '支持 {formats}',

  'locale.zh': '中文',
  'locale.en': 'English',
} as const

export default messages
