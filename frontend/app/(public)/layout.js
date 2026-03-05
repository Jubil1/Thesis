import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export default function PublicLayout({ children }) {
    return (
        <>
            <PublicNavbar />
            <main style={{ marginTop: '80px', padding: '2rem 0' }}>
                {children}
            </main>
            <Footer />
        </>
    );
}
