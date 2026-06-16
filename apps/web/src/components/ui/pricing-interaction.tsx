"use client";
import NumberFlow from '@number-flow/react'
import React from "react";

export function PricingInteraction ({
  starterMonth,
  starterAnnual,
  proMonth,
  proAnnual,
}:{
  starterMonth: number;
  starterAnnual: number;
  proMonth: number;
  proAnnual: number;
}) {
  const [active, setActive] = React.useState(0);
  const [period, setPeriod] = React.useState(0);
  const handleChangePlan = (index: number) => {
    setActive(index);
  };
  const handleChangePeriod = (index: number) => {
    setPeriod(index);
    if (index === 0) {
      setStarter(starterMonth);
      setPro(proMonth);
    } else {
      setStarter(starterAnnual);
      setPro(proAnnual);
    }
  };
  const [starter, setStarter] = React.useState(starterMonth);
  const [pro, setPro] = React.useState(proMonth);

  return (
    <div className="border border-border/80 rounded-[32px] p-3 shadow-2xl max-w-sm w-full flex flex-col items-center gap-3 bg-card/90 backdrop-blur-xl ring-1 ring-border/50 text-card-foreground relative z-10">
        <div className="rounded-full relative w-full bg-background border border-border/50 p-1.5 flex items-center shadow-inner">
          <button
            className={`font-semibold rounded-full w-full p-1.5 z-20 transition-all duration-300 ${period === 0 ? 'text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => handleChangePeriod(0)}
          >
            Monthly
          </button>
          <button
            className={`font-semibold rounded-full w-full p-1.5 z-20 transition-all duration-300 ${period === 1 ? 'text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => handleChangePeriod(1)}
          >
            Yearly
          </button>
          <div
            className="p-1.5 flex items-center justify-center absolute inset-0 w-1/2 z-10"
            style={{
              transform: `translateX(${period * 100}%)`,
              transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="bg-primary shadow-md rounded-full w-full h-full"></div>
          </div>
        </div>
        <div className="w-full relative flex flex-col items-center justify-center gap-3">
          <div
            className={`w-full flex justify-between cursor-pointer border-2 p-4 rounded-2xl relative z-10 transition-colors duration-300 ${active === 0 ? 'border-primary bg-primary/5' : 'border-border/50 bg-background/50 hover:border-border'}`}
            onClick={() => handleChangePlan(0)}
          >
            <div className="flex flex-col items-start">
              <p className={`font-bold text-xl ${active === 0 ? 'text-primary' : 'text-foreground'}`}>Free</p>
              <p className="text-muted-foreground text-md">
                <span className="text-foreground font-medium">$0.00</span>/month
              </p>
            </div>
            <div className={`border-2 size-6 rounded-full mt-0.5 p-1 flex items-center justify-center transition-colors duration-300 ${active === 0 ? 'border-primary' : 'border-muted-foreground/40'}`}>
              <div className={`size-3 rounded-full transition-all duration-300 ${active === 0 ? 'bg-primary scale-100 opacity-100' : 'bg-transparent scale-50 opacity-0'}`}></div>
            </div>
          </div>
          <div
            className={`w-full flex justify-between cursor-pointer border-2 p-4 rounded-2xl relative z-10 transition-colors duration-300 ${active === 1 ? 'border-primary bg-primary/5' : 'border-border/50 bg-background/50 hover:border-border'}`}
            onClick={() => handleChangePlan(1)}
          >
            <div className="flex flex-col items-start">
              <p className={`font-bold text-xl flex items-center gap-2 ${active === 1 ? 'text-primary' : 'text-foreground'}`}>
                Starter{" "}
                <span className="py-0.5 px-2.5 block rounded-full bg-chart-4/15 text-chart-4 text-xs font-bold border border-chart-4/30">
                  Popular
                </span>
              </p>
              <p className="text-muted-foreground text-md flex">
                <span className="text-foreground font-medium flex items-center">
                  ${" "}
                  <NumberFlow
                    className="text-foreground font-bold"
                    value={starter}
                  />
                </span>
                /month
              </p>
            </div>
            <div className={`border-2 size-6 rounded-full mt-0.5 p-1 flex items-center justify-center transition-colors duration-300 ${active === 1 ? 'border-primary' : 'border-muted-foreground/40'}`}>
              <div className={`size-3 rounded-full transition-all duration-300 ${active === 1 ? 'bg-primary scale-100 opacity-100' : 'bg-transparent scale-50 opacity-0'}`}></div>
            </div>
          </div>
          <div
            className={`w-full flex justify-between cursor-pointer border-2 p-4 rounded-2xl relative z-10 transition-colors duration-300 ${active === 2 ? 'border-primary bg-primary/5' : 'border-border/50 bg-background/50 hover:border-border'}`}
            onClick={() => handleChangePlan(2)}
          >
            <div className="flex flex-col items-start">
              <p className={`font-bold text-xl ${active === 2 ? 'text-primary' : 'text-foreground'}`}>Pro</p>
              <p className="text-muted-foreground text-md flex">
                <span className="text-foreground font-medium flex items-center">
                  ${" "}
                  <NumberFlow
                    className="text-foreground font-bold"
                    value={pro}
                  />
                </span>
                /month
              </p>
            </div>
            <div className={`border-2 size-6 rounded-full mt-0.5 p-1 flex items-center justify-center transition-colors duration-300 ${active === 2 ? 'border-primary' : 'border-muted-foreground/40'}`}>
              <div className={`size-3 rounded-full transition-all duration-300 ${active === 2 ? 'bg-primary scale-100 opacity-100' : 'bg-transparent scale-50 opacity-0'}`}></div>
            </div>
          </div>
          {/* Selection Box Outline Animation */}
          <div
            className="w-full h-[88px] absolute top-0 border-[2.5px] border-primary rounded-2xl z-20 pointer-events-none shadow-[0_0_15px_rgba(var(--primary),0.15)]"
            style={{
              transform: `translateY(${active * 88 + 12 * active}px)`,
              transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          ></div>
        </div>
        <button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg w-full p-3.5 mt-2 active:scale-[0.98] transition-all duration-300 shadow-xl ring-1 ring-primary/20">
          Get Started
        </button>
      </div>
  );
}
