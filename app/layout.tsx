import type { Metadata } from 'next';
import '../frontend/src/style.css';
export const metadata:Metadata={title:'ForgeAI — Manufacturing Finance',description:'Review manufacturing requirements, compare supplier offers, approve requests and reconcile invoices with traceable evidence.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
