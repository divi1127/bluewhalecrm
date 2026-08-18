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
      { name: 'Donut Slide', desc: 'Slide down giant inflatable donuts.', price: 200, image: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Kids_playing_on_inflatable_slide_in_Sherman_Park.jpg' },
      { name: 'Spider Tower', desc: 'Climb the web-covered spider tower.', price: 250, image: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Rope_Climbing_%288333076%29.jpg' },
      { name: 'Dashing Ball', desc: 'Dash across trampolines to hit the ball.', price: 200, image: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Andrew_Ketchum_dodging_a_ball_at_the_World_Dodgeball_Championships_in_Los_Angeles_in_2018.jpg' },
      { name: 'Foam Pit Area', desc: 'Bounce and land soft in the foam pit.', price: 180, image: 'https://upload.wikimedia.org/wikipedia/commons/8/85/PizzaPrincess_at_Twitchcon_San_Diego_2022_foam_pit.jpg' },
      { name: 'Spider Bridge', desc: 'Cross the wobbly spider web bridge.', price: 250, image: 'https://upload.wikimedia.org/wikipedia/commons/4/45/FDCC_Rope_Course_%288883070%29.jpg' },
      { name: 'Air Balloon', desc: 'Tumble and float inside giant air balloons.', price: 200, image: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Kids_Inflatable_playcentre_in_Melbourne_VIC_Australia.jpg' },
      { name: 'Trampoline Area', desc: 'Endless bouncing across a huge trampoline court.', price: 250, image: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Ryze_Hong_Kong.jpg' },
      { name: 'Basketball Trampoline', desc: 'Slam dunks while bouncing high.', price: 250, image: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/USCU_Trampoline_Dunk_during_Midnight_Madness_at_the_G._B._Hodge_Center.jpg' },
      { name: '360 Cycle', desc: 'Pedal your way through a full 360° spin.', price: 220, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Mountain_biking.jpg/960px-Mountain_biking.jpg' },
      { name: 'Wipeout', desc: 'Outlast the padded arms on the wipeout arena.', price: 300, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Young_children_play_in_a_colorful_indoor_play_area_as_one_pushes_the_other_during_a_fun_and_energetic_moment.jpg/960px-Young_children_play_in_a_colorful_indoor_play_area_as_one_pushes_the_other_during_a_fun_and_energetic_moment.jpg' },
    ],
  },
  {
    id: 'outdoor',
    label: 'Outdoor Activities',
    emoji: '🏏',
    tone: 'from-emerald-500 to-teal-600',
    items: [
      { name: 'Zipline', desc: 'Soar across cables high above the park.', price: 350, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Zip_Line_Canopy_Tour_Costa_Rica.jpg/960px-Zip_Line_Canopy_Tour_Costa_Rica.jpg' },
      { name: 'Zipcycle', desc: 'Ride a suspended cycle along the zip line.', price: 400, image: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/%D7%96%D7%99%D7%A4%D7%9C%D7%99%D7%99%D7%9F_%D7%90%D7%95%D7%A4%D7%A0%D7%99%D7%99%D7%9D.jpg' },
      { name: 'Wall Climbing', desc: 'Scale climbing walls with safety harnesses.', price: 300, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Child_climbs_a_blue_indoor_climbing_wall_at_a_sport_center.jpg/960px-Child_climbs_a_blue_indoor_climbing_wall_at_a_sport_center.jpg' },
      { name: 'Rocket Ejector', desc: 'Blast high into the air on the ejector ride.', price: 450, image: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Magma_Drop_Tower_Ride_at_Paultons_Park.jpg' },
      { name: '4-Seater Gyro', desc: 'Spin together on the giant 4-seater gyro.', price: 400, image: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Extreme_-_Orbiter%2C_spinning_night.jpg' },
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
