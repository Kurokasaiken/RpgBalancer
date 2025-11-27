import { Toaster as SonnerToaster } from 'sonner';

export const Toaster = () => (
    <SonnerToaster
        position="top-right"
        theme="dark"
        richColors
        expand={true}
        closeButton
        toastOptions={{
            style: {
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
            },
        }}
    />
);
