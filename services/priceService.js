const GovtPriceCache = require('../models/GovtPriceCache');

// ─────────────────────────────────────────────────────────
// SEED DATA — MSP 2024-25 (Cabinet Committee on Economic
// Affairs, Govt. of India) + Mandi reference prices.
// All prices stored as Rs per KG.
// Sources:
//   MSP: https://cacp.dacnet.nic.in
//   Mandi ref: Agmarknet national averages
// ─────────────────────────────────────────────────────────
const SEED_PRICES = [
    // ── CEREALS (MSP) ──
    { crop: 'paddy',       price: 23.00, season: '2024-25' },
    { crop: 'rice',        price: 23.00, season: '2024-25' },
    { crop: 'wheat',       price: 22.75, season: '2024-25' },
    { crop: 'maize',       price: 20.90, season: '2024-25' },
    { crop: 'corn',        price: 20.90, season: '2024-25' },
    { crop: 'jowar',       price: 33.71, season: '2024-25' },
    { crop: 'sorghum',     price: 33.71, season: '2024-25' },
    { crop: 'bajra',       price: 26.25, season: '2024-25' },
    { crop: 'millet',      price: 26.25, season: '2024-25' },
    { crop: 'barley',      price: 18.50, season: '2024-25' },
    { crop: 'ragi',        price: 40.48, season: '2024-25' },

    // ── PULSES (MSP) ──
    { crop: 'gram',        price: 54.40, season: '2024-25' },
    { crop: 'chickpea',    price: 54.40, season: '2024-25' },
    { crop: 'chana',       price: 54.40, season: '2024-25' },
    { crop: 'arhar',       price: 75.50, season: '2024-25' },
    { crop: 'tur',         price: 75.50, season: '2024-25' },
    { crop: 'toor',        price: 75.50, season: '2024-25' },
    { crop: 'moong',       price: 86.82, season: '2024-25' },
    { crop: 'green gram',  price: 86.82, season: '2024-25' },
    { crop: 'urad',        price: 74.00, season: '2024-25' },
    { crop: 'black gram',  price: 74.00, season: '2024-25' },
    { crop: 'lentil',      price: 62.00, season: '2024-25' },
    { crop: 'masur',       price: 62.00, season: '2024-25' },

    // ── OILSEEDS (MSP) ──
    { crop: 'soyabean',    price: 48.92, season: '2024-25' },
    { crop: 'soybean',     price: 48.92, season: '2024-25' },
    { crop: 'groundnut',   price: 67.83, season: '2024-25' },
    { crop: 'peanut',      price: 67.83, season: '2024-25' },
    { crop: 'sunflower',   price: 72.80, season: '2024-25' },
    { crop: 'mustard',     price: 56.50, season: '2024-25' },
    { crop: 'rapeseed',    price: 56.50, season: '2024-25' },
    { crop: 'sesame',      price: 90.00, season: '2024-25' },
    { crop: 'til',         price: 90.00, season: '2024-25' },
    { crop: 'safflower',   price: 58.00, season: '2024-25' },

    // ── CASH CROPS (MSP / regulated) ──
    { crop: 'cotton',      price: 71.21, season: '2024-25' },
    { crop: 'sugarcane',   price: 3.40,  season: '2024-25' },
    { crop: 'jute',        price: 53.35, season: '2024-25' },
    { crop: 'tobacco',     price: 85.00, season: '2024-25' },

    // ── VEGETABLES (Mandi national average reference) ──
    { crop: 'tomato',      price: 25.00, season: '2024-25' },
    { crop: 'onion',       price: 15.00, season: '2024-25' },
    { crop: 'potato',      price: 12.00, season: '2024-25' },
    { crop: 'brinjal',     price: 18.00, season: '2024-25' },
    { crop: 'eggplant',    price: 18.00, season: '2024-25' },
    { crop: 'cauliflower', price: 20.00, season: '2024-25' },
    { crop: 'cabbage',     price: 12.00, season: '2024-25' },
    { crop: 'peas',        price: 35.00, season: '2024-25' },
    { crop: 'green peas',  price: 35.00, season: '2024-25' },
    { crop: 'carrot',      price: 22.00, season: '2024-25' },
    { crop: 'garlic',      price: 80.00, season: '2024-25' },
    { crop: 'ginger',      price: 60.00, season: '2024-25' },
    { crop: 'chilli',      price: 100.00, season: '2024-25' },
    { crop: 'chilly',      price: 100.00, season: '2024-25' },
    { crop: 'capsicum',    price: 35.00, season: '2024-25' },
    { crop: 'okra',        price: 25.00, season: '2024-25' },
    { crop: 'ladyfinger',  price: 25.00, season: '2024-25' },
    { crop: 'bhindi',      price: 25.00, season: '2024-25' },
    { crop: 'spinach',     price: 20.00, season: '2024-25' },
    { crop: 'palak',       price: 20.00, season: '2024-25' },
    { crop: 'methi',       price: 25.00, season: '2024-25' },
    { crop: 'fenugreek',   price: 25.00, season: '2024-25' },
    { crop: 'cucumber',    price: 15.00, season: '2024-25' },
    { crop: 'pumpkin',     price: 12.00, season: '2024-25' },
    { crop: 'bitter gourd', price: 30.00, season: '2024-25' },
    { crop: 'karela',      price: 30.00, season: '2024-25' },
    { crop: 'bottle gourd', price: 12.00, season: '2024-25' },
    { crop: 'lauki',       price: 12.00, season: '2024-25' },
    { crop: 'tinda',       price: 22.00, season: '2024-25' },
    { crop: 'radish',      price: 12.00, season: '2024-25' },
    { crop: 'mooli',       price: 12.00, season: '2024-25' },
    { crop: 'beetroot',    price: 18.00, season: '2024-25' },
    { crop: 'sweet potato', price: 20.00, season: '2024-25' },
    { crop: 'yam',         price: 25.00, season: '2024-25' },
    { crop: 'drumstick',   price: 40.00, season: '2024-25' },
    { crop: 'moringa',     price: 40.00, season: '2024-25' },
    { crop: 'colocasia',   price: 22.00, season: '2024-25' },
    { crop: 'arbi',        price: 22.00, season: '2024-25' },

    // ── FRUITS (Mandi national average reference) ──
    { crop: 'banana',      price: 20.00, season: '2024-25' },
    { crop: 'mango',       price: 50.00, season: '2024-25' },
    { crop: 'apple',       price: 80.00, season: '2024-25' },
    { crop: 'grapes',      price: 60.00, season: '2024-25' },
    { crop: 'orange',      price: 35.00, season: '2024-25' },
    { crop: 'papaya',      price: 18.00, season: '2024-25' },
    { crop: 'guava',       price: 25.00, season: '2024-25' },
    { crop: 'watermelon',  price: 10.00, season: '2024-25' },
    { crop: 'pomegranate', price: 70.00, season: '2024-25' },
    { crop: 'pineapple',   price: 30.00, season: '2024-25' },
    { crop: 'lemon',       price: 40.00, season: '2024-25' },
    { crop: 'lime',        price: 40.00, season: '2024-25' },
    { crop: 'coconut',     price: 18.00, season: '2024-25' }, // per piece avg ~₹18
    { crop: 'litchi',      price: 90.00, season: '2024-25' },
    { crop: 'jamun',       price: 50.00, season: '2024-25' },
    { crop: 'jackfruit',   price: 20.00, season: '2024-25' },
    { crop: 'sapota',      price: 30.00, season: '2024-25' },
    { crop: 'chikoo',      price: 30.00, season: '2024-25' },
    { crop: 'kiwi',        price: 120.00, season: '2024-25' },
    { crop: 'strawberry',  price: 150.00, season: '2024-25' },
    { crop: 'plum',        price: 70.00, season: '2024-25' },
    { crop: 'peach',       price: 60.00, season: '2024-25' },
    { crop: 'pear',        price: 55.00, season: '2024-25' },
];

// ─────────────────────────────────────────────────────────
// Seed default prices on first run
// ─────────────────────────────────────────────────────────
exports.seedDefaultPrices = async () => {
    try {
        const count = await GovtPriceCache.countDocuments({ source: 'seeded' });
        if (count > 0) {
            console.log(`ℹ️  [PriceService] Govt price cache already seeded (${count} records)`);
            return;
        }

        const docs = SEED_PRICES.map(({ crop, price, season }) => ({
            crop: crop.toLowerCase(),
            state: 'national',
            price,
            unit: 'kg',
            source: 'seeded',
            season,
            lastUpdated: new Date()
        }));

        // ordered: false → insert all, skip any duplicates silently
        await GovtPriceCache.insertMany(docs, { ordered: false });
        console.log(`✅ [PriceService] Seeded ${docs.length} govt price records into DB`);
    } catch (err) {
        // E11000 = duplicate key on re-seed — safe to ignore
        if (err.code !== 11000) {
            console.error('[PriceService] Seed error:', err.message);
        }
    }
};

// ─────────────────────────────────────────────────────────
// Fetch from data.gov.in Agmarknet API (optional)
// Requires GOVT_PRICE_API_KEY in .env
// Fails silently and returns null → falls through to cache
// ─────────────────────────────────────────────────────────
const fetchFromLiveAPI = async (crop, state) => {
    const apiKey = process.env.GOVT_PRICE_API_KEY;
    const apiUrl = process.env.GOVT_PRICE_API_URL ||
        'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

    // Skip if no API key configured
    if (!apiKey || apiKey.startsWith('your_')) return null;

    try {
        const url = new URL(apiUrl);
        url.searchParams.set('api-key', apiKey);
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '10');
        if (crop) url.searchParams.set('filters[Commodity]', crop);
        if (state) url.searchParams.set('filters[State]', state);

        // Use native fetch (Node 18+), hard timeout 5s
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url.toString(), { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) return null;

        const json = await response.json();
        const records = json?.records;
        if (!Array.isArray(records) || records.length === 0) return null;

        // Agmarknet stores price per quintal (100 kg) — convert to per kg
        const prices = records
            .map(r => parseFloat(r.Modal_Price || r.modal_price || 0))
            .filter(p => p > 0);

        if (prices.length === 0) return null;

        const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        return {
            price: Math.round((avg / 100) * 100) / 100, // per kg, 2 decimals
            source: 'api',
            unit: 'kg'
        };
    } catch {
        return null; // Network error, timeout, invalid JSON — all safe
    }
};

// ─────────────────────────────────────────────────────────
// Fetch from DB cache
// Priority: state-specific → national
// ─────────────────────────────────────────────────────────
const fetchFromCache = async (cropLower, stateLower) => {
    // State-specific first
    if (stateLower && stateLower !== 'national') {
        const stateRecord = await GovtPriceCache.findOne(
            { crop: cropLower, state: stateLower }
        ).lean();
        if (stateRecord) return { price: stateRecord.price, source: stateRecord.source, unit: stateRecord.unit };
    }

    // Fall back to national average
    const national = await GovtPriceCache.findOne(
        { crop: cropLower, state: 'national' }
    ).lean();
    return national ? { price: national.price, source: national.source, unit: national.unit } : null;
};

// ─────────────────────────────────────────────────────────
// Master orchestrator: API → Cache → Fuzzy fallback → null
// ─────────────────────────────────────────────────────────
exports.getGovtPrice = async (cropName, state = null) => {
    if (!cropName) return null;

    // Normalize: "Organic Tomato" → try "tomato" first, then "organic"
    const words = cropName.toLowerCase().trim().split(/\s+/);
    const primaryCrop = words[words.length - 1];  // last word most specific
    const fallbackCrop = words[0];
    const stateLower = state ? state.toLowerCase().trim() : null;

    // 1. Live API
    const apiResult = await fetchFromLiveAPI(primaryCrop, state);
    if (apiResult) {
        // Persist fresh API result into cache
        await GovtPriceCache.findOneAndUpdate(
            { crop: primaryCrop, state: stateLower || 'national' },
            { ...apiResult, crop: primaryCrop, state: stateLower || 'national', lastUpdated: new Date() },
            { upsert: true, new: true }
        );
        return { ...apiResult, source: 'api' };
    }

    // 2. DB cache (primary word)
    const cacheResult = await fetchFromCache(primaryCrop, stateLower);
    if (cacheResult) return { ...cacheResult, source: 'cache' };

    // 3. Fuzzy fallback (first word, e.g. "organic" skipped, tries "tomato" again)
    if (fallbackCrop !== primaryCrop) {
        const fuzzyResult = await fetchFromCache(fallbackCrop, stateLower);
        if (fuzzyResult) return { ...fuzzyResult, source: 'cache' };
    }

    return null; // Crop not found at all
};

// ─────────────────────────────────────────────────────────────────────────────
// Price comparison badge generator  —  6-tier Indian Farming Context
//
// Indian law context (APMC reforms 2020 + CACP guidelines):
//   • MSP = MINIMUM Support Price — floor the GOVERNMENT promises to buy at.
//   • Selling BELOW MSP = farmer is leaving guaranteed money on the table.
//   • Selling ABOVE MSP = completely legal, farmer's market freedom, normal.
//   • Government does NOT cap the upper price — farmers can sell at any premium.
//
// Tier Map:
//   < 50% of MSP   →  CRITICALLY_LOW  — dangerously below govt guarantee
//   50–85% of MSP  →  BELOW_MSP       — below govt support, strong advisory
//   85–100% of MSP →  NEAR_MSP        — just under MSP, gentle nudge
//   100–140% MSP   →  FAIR            — at or above MSP, healthy market price
//   140–250% MSP   →  PREMIUM         — above MSP, farmer exercising market rights
//   > 250% MSP     →  VERY_HIGH       — very high, soft market advisory only
// ─────────────────────────────────────────────────────────────────────────────
exports.getPriceComparison = (farmerPrice, govtPrice) => {
    if (!govtPrice || !farmerPrice || farmerPrice <= 0 || govtPrice <= 0) return null;

    const diff = farmerPrice - govtPrice;
    const rawPct = (diff / govtPrice) * 100;
    const absPct = Math.abs(rawPct).toFixed(1);
    const pctLabel = rawPct >= 0 ? `+${rawPct.toFixed(1)}%` : `${rawPct.toFixed(1)}%`;
    const ratio = farmerPrice / govtPrice;

    // Tier 1 — Critically below MSP (< 50%)
    if (ratio < 0.50) {
        return {
            status: 'CRITICALLY_LOW',
            badge: 'Too Low — Check Govt Rate',
            icon: '🔴',
            color: '#dc2626',
            bgColor: '#fef2f2',
            borderColor: '#fecaca',
            percentage: pctLabel,
            message: `Your price (₹${farmerPrice}) is ${absPct}% below the government MSP (₹${govtPrice}). ` +
                     `Government procurement agencies are legally required to buy your crop ` +
                     `at ₹${govtPrice}/kg. Consider raising your price or selling via govt channels.`
        };
    }

    // Tier 2 — Below MSP (50–85%)
    if (ratio < 0.85) {
        return {
            status: 'BELOW_MSP',
            badge: 'Below Govt MSP — Earn More',
            icon: '🟠',
            color: '#ea580c',
            bgColor: '#fff7ed',
            borderColor: '#fed7aa',
            percentage: pctLabel,
            message: `Your price (₹${farmerPrice}) is ${absPct}% below the MSP (₹${govtPrice}). ` +
                     `Tip: Govt agencies (FCI, NAFED, APMC) are mandated to purchase your ` +
                     `crop at ₹${govtPrice}. You may be leaving money on the table.`
        };
    }

    // Tier 3 — Slightly below MSP (85–100%)
    if (ratio < 1.00) {
        return {
            status: 'NEAR_MSP',
            badge: 'Slightly Below MSP',
            icon: '🟡',
            color: '#b45309',
            bgColor: '#fefce8',
            borderColor: '#fde68a',
            percentage: pctLabel,
            message: `Just ${absPct}% below the govt MSP (₹${govtPrice}). ` +
                     `Government procurement centers guarantee ₹${govtPrice}/kg for this crop. ` +
                     `Consider pricing at MSP or above to maximise your earnings.`
        };
    }

    // Tier 4 — At or just above MSP (100–140%) — ideal range
    if (ratio < 1.40) {
        return {
            status: 'FAIR',
            badge: 'Fair Market Price ✓',
            icon: '🟢',
            color: '#16a34a',
            bgColor: '#f0fdf4',
            borderColor: '#bbf7d0',
            percentage: pctLabel,
            message: farmerPrice >= govtPrice
                ? `Priced ${rawPct.toFixed(1)}% above MSP (₹${govtPrice}). ` +
                  `As a farmer, you have the legal right to sell at any market price above MSP. ` +
                  `Buyers get quality produce directly from the source.`
                : `Fair price near MSP. Buyers will appreciate the competitive value.`
        };
    }

    // Tier 5 — Premium pricing (140–250%) — legal, highlight quality
    if (ratio < 2.50) {
        return {
            status: 'PREMIUM',
            badge: 'Premium Pricing',
            icon: '🔵',
            color: '#2563eb',
            bgColor: '#eff6ff',
            borderColor: '#bfdbfe',
            percentage: pctLabel,
            message: `Priced ${rawPct.toFixed(1)}% above MSP. Indian farmers have the legal right ` +
                     `to sell at any price above MSP (APMC Reform 2020). ` +
                     `Highlight your crop's freshness, quality, or organic certification ` +
                     `to attract buyers at this premium.`
        };
    }

    // Tier 6 — Very high pricing (> 250%) — soft advisory only, never blocking
    return {
        status: 'VERY_HIGH',
        badge: 'Very High — Market Advisory',
        icon: '⚠️',
        color: '#7c3aed',
        bgColor: '#faf5ff',
        borderColor: '#ddd6fe',
        percentage: pctLabel,
        message: `Priced at ${ratio.toFixed(1)}× the reference MSP (₹${govtPrice}). ` +
                 `You can legally sell at this price — farmers have full pricing freedom above MSP. ` +
                 `A strong quality story or premium branding will help buyers justify this price.`
    };
};

// ─────────────────────────────────────────────────────────
// Force-refresh a crop's price from live API (admin)
// ─────────────────────────────────────────────────────────
exports.refreshGovtPrice = async (crop, state) => {
    const cropLower = crop?.toLowerCase().trim();
    const stateLower = state?.toLowerCase().trim() || 'national';

    // Remove stale record
    await GovtPriceCache.deleteOne({ crop: cropLower, state: stateLower });

    const apiResult = await fetchFromLiveAPI(cropLower, state);
    if (apiResult) {
        await GovtPriceCache.create({
            crop: cropLower,
            state: stateLower,
            ...apiResult,
            lastUpdated: new Date()
        });
        return apiResult;
    }
    return null;
};

// ─────────────────────────────────────────────────────────
// Get all cached prices (admin dashboard)
// ─────────────────────────────────────────────────────────
exports.getAllCachedPrices = async () => {
    return GovtPriceCache.find({}).sort({ crop: 1, state: 1 }).lean();
};
