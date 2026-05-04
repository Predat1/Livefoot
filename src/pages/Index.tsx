import React from "react";
import Header from "@/components/Header";
import Layout from "@/components/Layout";

const Index = () => {
  return (
    <Layout>
      <main className="container pt-4 pb-20">
        <h1 className="text-2xl font-bold text-center mt-20">LiveFoot - Chargement en cours...</h1>
        <p className="text-center text-muted-foreground mt-4">Si cet écran persiste, veuillez rafraîchir la page.</p>
      </main>
    </Layout>
  );
};

export default Index;
