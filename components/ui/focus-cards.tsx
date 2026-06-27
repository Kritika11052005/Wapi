/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
  }: {
    card: any;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
  }) => (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "rounded-2xl relative bg-wapi-card-bg border border-wapi-cyan/20 overflow-hidden h-72 md:h-80 w-full transition-all duration-300 ease-out p-8 flex flex-col justify-center cursor-pointer shadow-lg hover:border-wapi-cyan/45 hover:shadow-[0_0_20px_rgba(0,180,216,0.1)]",
        hovered !== null && hovered !== index && "blur-[3px] scale-[0.97] opacity-40"
      )}
    >
      {card.src ? (
        <>
          <img
            src={card.src}
            alt={card.title}
            className="object-cover absolute inset-0 w-full h-full"
            loading="lazy"
          />
          <div
            className={cn(
              "absolute inset-0 bg-black/60 flex items-end py-8 px-6 transition-opacity duration-300",
              hovered === index ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200">
              {card.title}
            </div>
          </div>
        </>
      ) : (
        <div className="relative z-10 flex flex-col items-start text-left h-full justify-between">
          <div className="flex flex-col gap-3">
            <span className="text-3xl">{card.icon}</span>
            <h3 className="text-lg md:text-xl font-clash text-white font-bold tracking-tight">{card.title}</h3>
          </div>
          <p className="text-sm text-wapi-mint leading-relaxed font-inter font-normal mt-2">
            {card.description}
          </p>
        </div>
      )}
    </div>
  )
);

Card.displayName = "Card";

type CardType = {
  title: string;
  src?: string;
  description?: string;
  icon?: string;
};

export function FocusCards({ cards }: { cards: CardType[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto md:px-8 w-full">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}
    </div>
  );
}
