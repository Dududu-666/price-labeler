import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Typography, theme } from 'antd'
import { ShoppingOutlined, AppstoreOutlined, LogoutOutlined } from '@ant-design/icons'
import { useAuth } from '@/contexts/AuthContext'

const { Header, Sider, Content } = Layout

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuth()
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()

  const menuItems = [
    {
      key: '/',
      icon: <ShoppingOutlined />,
      label: '商品管理',
    },
    {
      key: '/categories',
      icon: <AppstoreOutlined />,
      label: '分类管理',
    },
  ]

  const selectedKey = location.pathname === '/categories' ? '/categories' : '/'

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography.Text strong style={{ color: '#fff', fontSize: 16 }}>
            💰 价格标注器
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button icon={<LogoutOutlined />} onClick={handleLogout} type="text">
            退出登录
          </Button>
        </Header>
        <Content style={{ margin: 16 }}>
          <div style={{ padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG, minHeight: 'calc(100vh - 112px)' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
