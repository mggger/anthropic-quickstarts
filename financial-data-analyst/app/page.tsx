// /app/page.tsx
"use client";

import React from "react";
import FinancePage from "./finance/page";
import Head from "next/head";


export default function Home() {
    return (<>
        <title>Freight Companion</title>
        <FinancePage/>;
    </>)
}
