export const venue = {
  name: 'bluewhale',
  tagline: "bluewhale's favourite game zone",
  description:
    'bluewhale is a full-service entertainment venue with indoor games, outdoor adventures, kids activities and a food & snack court — all under one roof. Book a slot, grab a hand tag and play.',
  address: '42, MG Road, Indiranagar, Bengaluru',
  phone: '+91 90000 12345',
  email: 'hello@gamespot.in',
  hours: [
    { days: 'Mon – Fri', time: '11 AM to 11 PM' },
    { days: 'Sat – Sun', time: '10 AM to 1 AM' },
  ],
  stats: [
    { value: '30+', label: 'Games & Activities' },
    { value: '4', label: 'Game Zones' },
    { value: '20+', label: 'Food & Snack Items' },
    { value: '50k+', label: 'Happy Visitors' },
  ],
  activities: [
    'Zipline – Ride across a cable from one platform to another.',
    'Rope Course – Balance, climb, and cross suspended obstacles.',
    'High Rope Course – Advanced rope activities at height.',
    'Net Climbing – Climb large rope/net structures.',
    'Wall Climbing – Artificial rock/wall climbing.',
    'Burma Bridge – Cross a suspended rope bridge.',
    'Commando Net – Climb through a military-style net.',
    'Tarzan Swing – Swing from a high platform using a rope.',
    'Giant Swing – Large-height adventure swing.',
    'Free Fall / Quick Jump – Controlled jump from a platform.',
    'Archery – Target shooting with bows and arrows.',
    'Paintball – Team-based outdoor shooting game.',
    'Air Rifle Shooting – Target shooting activity.',
    'ATV/Quad Bike Ride – Off-road vehicle experience.',
    'Dirt Bike Track – Off-road bike riding.',
    'Human Foosball – Outdoor team game.',
    'Bubble Soccer – Players wear inflatable bubbles and play football.',
    'Zorb Ball – Roll/play inside a large inflatable ball.',
    'Obstacle Course – Multiple physical challenges.',
    'Treasure Hunt – Team-based outdoor game.',
    'Camping & Bonfire – Evening outdoor experience.',
    'Kids Adventure Zone – Mini zipline, climbing, nets, tunnels, etc',
  ],
  heroImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&s=6a6f8d2d9b1d5f3d9a6f3b2a8b9b1c3e',
  heroTitle: 'A magical outdoor adventure',
  heroSubtitle: 'Zipline, climbing, archery and more — activities for all ages',
}

export const gallery = [
  {
    id: 'indoor',
    label: 'Indoor Activities',
    emoji: '🎳',
    tone: 'from-indigo-500 to-purple-600',
    items: [
      { name: 'Donut Slide', desc: 'Slide down giant inflatable donuts.', price: 200, image: 'https://i.pinimg.com/1200x/47/b3/36/47b3365ed626a141a8d1b9fe403f5133.jpg' },
      { name: 'Spider Tower', desc: 'Climb the web-covered spider tower.', price: 250, image: 'https://image.made-in-china.com/2f0j00YeJkqdCWSicI/Play-Standard-Indoor-Trampoline-Kids-Spider-Clmbing-Tower-with-Playground-Tube-Slide.webp' },
      { name: 'Dashing Ball', desc: 'Dash across trampolines to hit the ball.', price: 200, image: 'https://i.pinimg.com/736x/9d/60/bf/9d60bf201aa77c080e77695164c401ac.jpg' },
      { name: 'Foam Pit Area', desc: 'Bounce and land soft in the foam pit.', price: 180, image: 'https://upload.wikimedia.org/wikipedia/commons/8/85/PizzaPrincess_at_Twitchcon_San_Diego_2022_foam_pit.jpg' },
      { name: 'Spider Bridge', desc: 'Cross the wobbly spider web bridge.', price: 250, image: 'https://i.pinimg.com/736x/46/17/b6/4617b659bae2a40ac7259ef11338e3e0.jpg' },
      { name: 'Air Balloon', desc: 'Tumble and float inside giant air balloons.', price: 200, image: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Kids_Inflatable_playcentre_in_Melbourne_VIC_Australia.jpg' },
      { name: 'Trampoline Area', desc: 'Endless bouncing across a huge trampoline court.', price: 250, image: 'https://i.pinimg.com/736x/b4/b2/07/b4b2078e61744b7b7bfd99d1a531e45f.jpg' },
      { name: 'Basketball Trampoline', desc: 'Slam dunks while bouncing high.', price: 250, image: 'https://i.pinimg.com/736x/27/b1/fc/27b1fc9acbee078fd3b9e604b581d807.jpg' },
      { name: '360 Cycle', desc: 'Pedal your way through a full 360° spin.', price: 220, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrrrxmZdiqLtUnea8j2qcxz-OmaA7W5zpxfp62l0btopIH3sS8QjJ_Wea6&s=10' },
      { name: 'Wipeout', desc: 'Outlast the padded arms on the wipeout arena.', price: 300, image: 'https://i.pinimg.com/1200x/62/e9/5b/62e95b2e015824cfdc7ac3be04ee636d.jpg' },
    ],
  },
  {
    id: 'outdoor',
    label: 'Outdoor Activities',
    emoji: '🏏',
    tone: 'from-emerald-500 to-teal-600',
    items: [
      { name: 'Zipline', desc: 'Soar across cables high above the park.', price: 350, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Zip_Line_Canopy_Tour_Costa_Rica.jpg/960px-Zip_Line_Canopy_Tour_Costa_Rica.jpg' },
      { name: 'Zipcycle', desc: 'Ride a suspended cycle along the zip line.', price: 400, image: 'https://i.pinimg.com/1200x/f2/2b/8d/f22b8df61664dded83f6cabfe0b489e1.jpg' },
      { name: 'Wall Climbing', desc: 'Scale climbing walls with safety harnesses.', price: 300, image: 'https://i.pinimg.com/736x/24/c8/cd/24c8cdf4e01f15d6325a8ed81382b96c.jpg' },
      { name: 'Rocket Ejector', desc: 'Blast high into the air on the ejector ride.', price: 450, image: 'https://i.pinimg.com/1200x/0b/ed/71/0bed71dc7fe088dae6f6786f6389cfd5.jpg' },
      { name: '4-Seater Gyro', desc: 'Spin together on the giant 4-seater gyro.', price: 400, image: 'https://5.imimg.com/data5/SELLER/Default/2024/1/381074008/DB/TI/UN/59899173/gyroscope-ride.png' },
    ],
  },
  {
    id: 'kids',
    label: 'Kids Activities',
    emoji: '🧸',
    tone: 'from-pink-500 to-rose-500',
    items: [
      { name: 'Kids Play Station', desc: 'A safe indoor play station — total 5 games for little ones.', price: 150, image: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Tung_Tao_Court_Indoor_playground_201407.jpg' },
    ],
  },
]

export const pricing = [
  { game: 'Bowling', category: 'Indoor', single: 300, perPerson: 250, packageSession: 200 },
  { game: 'VR Gaming', category: 'Arcade', single: 500, perPerson: 450, packageSession: 380 },
  { game: 'Racing Simulator', category: 'Arcade', single: 400, perPerson: 350, packageSession: 300 },
  { game: 'Laser Tag', category: 'Indoor', single: 450, perPerson: 400, packageSession: 350 },
  { game: 'Go Karting', category: 'Outdoor', single: 400, perPerson: 350, packageSession: 300 },
  { game: 'Cricket', category: 'Outdoor', single: 600, perPerson: 550, packageSession: 450 },
  { game: 'Paintball', category: 'Outdoor', single: 550, perPerson: 500, packageSession: 420 },
  { game: 'Billiards', category: 'Indoor', single: 250, perPerson: 220, packageSession: 180 },
  { game: 'Table Tennis', category: 'Indoor', single: 200, perPerson: 180, packageSession: 150 },
  { game: 'Karaoke', category: 'Indoor', single: 350, perPerson: 300, packageSession: 250 },
  { game: 'Archery', category: 'Outdoor', single: 300, perPerson: 250, packageSession: 200 },
  { game: 'Arcade Zone', category: 'Arcade', single: 150, perPerson: 120, packageSession: 100 },
]

export const memberships = [
  { name: 'Basic', price: 999, discount: 5, benefits: ['5% off on games & food', 'Priority billing', 'Birthday discount voucher', 'Free entry on your birthday'], color: 'from-slate-500 to-slate-700' },
  { name: 'Silver', price: 1999, discount: 10, benefits: ['10% off on games & food', '1 free game session / month', 'Priority booking', 'Loyalty points x1.5'], color: 'from-slate-400 to-slate-600' },
  { name: 'Gold', price: 3999, discount: 15, benefits: ['15% off on games & food', '2 free game sessions / month', 'Priority queue access', 'Free snack combo every visit'], color: 'from-amber-500 to-orange-600', popular: true },
  { name: 'Platinum', price: 7999, discount: 20, benefits: ['20% off on games & food', 'Unlimited bowling & arcade', 'Dedicated host', 'Complimentary VIP lounge access'], color: 'from-purple-500 to-fuchsia-600' },
]

export const packages = [
  { name: 'Starter', price: 999, meta: '5 sessions · 30 days', included: ['Bowling', 'Arcade Zone'] },
  { name: 'Explorer', price: 1799, meta: '10 sessions · 60 days', included: ['Bowling', 'Table Tennis', 'Laser Tag'] },
  { name: 'Premium', price: 2999, meta: '20 sessions · 90 days', included: ['Bowling', 'Laser Tag', 'Go Karting', 'VR Gaming'] },
  { name: 'Family Pass', price: 4999, meta: '4 members · 30 days', included: ['All games & activities for 4 members'] },
]
