import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { ConfigProvider } from 'antd';
import ptBR from 'antd/locale/pt_BR';

export default function App() {
  return (
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: '#f97316', // Tailwind orange-500
          borderRadius: 8,
        },
        components: {
        },
      }}
    >
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ConfigProvider>
  );
}
