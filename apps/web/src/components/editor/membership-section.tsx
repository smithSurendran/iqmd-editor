const TIERS = [
  {
    name: "Gold Membership", price: "$109/month",
    benefits: [
      "30% off Pure Encapsulations supplements",
      "20% off Thorne vitamins",
      "30% off IV infusions plus rotating 50% off deals",
      "Access to premium peptides including GH, NAD+, Mounjaro, and Glutathione",
      "One free lab panel per year",
      "Priority scheduling and concierge text access during business hours",
      "Discounts on prescription medications with first priority",
    ],
  },
  {
    name: "Hormone Optimization Membership", price: "$75/month",
    benefits: [
      "Personalized hormone treatment plan including BHRT, peptides, and labs",
      "30% off Pure Encapsulations hormone, adrenal, and metabolic support",
      "20% off Thorne vitamins",
      "20% off IV infusions plus rotating 50% off deals",
      "Discounts on peptides including Mounjaro, Ozempic, NAD+, GH, and Glutathione",
      "Discounts on prescription medications including hormone therapies",
      "10 yearly visits or texts with prescriptions",
    ],
  },
  {
    name: "Silver Membership", price: "$49.99/month",
    benefits: [
      "20% off Pure Encapsulations supplements",
      "10% off Thorne vitamins",
      "10% off IV infusions",
      "Discounts on prescription medications",
      "Option to upgrade anytime to higher tiers",
      "Annual lab panel",
      "5 yearly visits or texts with prescriptions",
    ],
  },
];

export function MembershipSection() {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="px-3 py-2 border-b border-slate-100 bg-amber-50 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-amber-800">IQMD Membership Levels</h4>
        <span className="text-[10px] text-amber-500 uppercase font-medium tracking-wide">Locked</span>
      </div>
      <div className="divide-y divide-slate-100">
        {TIERS.map((tier) => (
          <div key={tier.name} className="px-4 py-3">
            <div className="flex items-baseline justify-between mb-1.5">
              <h5 className="text-sm font-semibold text-slate-800">{tier.name}</h5>
              <span className="text-sm font-bold text-purple-700">{tier.price}</span>
            </div>
            <ul className="text-xs text-slate-500 space-y-0.5 list-disc list-inside">
              {tier.benefits.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}