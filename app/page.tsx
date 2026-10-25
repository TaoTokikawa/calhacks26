'use client';
import dynamic from 'next/dynamic';
const App=dynamic(()=>import('../frontend/src/main'),{ssr:false});
export default function Page(){return <App/>}
