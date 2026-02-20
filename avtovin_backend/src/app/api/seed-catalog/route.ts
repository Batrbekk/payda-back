import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

const catalog = [
  {
    brand: "Toyota",
    models: [
      { name: "Camry", generations: [
        { name: "XV40 (2006-2011)", yearFrom: 2006, yearTo: 2011, engineTypes: "ICE,HYBRID" },
        { name: "XV50 (2011-2017)", yearFrom: 2011, yearTo: 2017, engineTypes: "ICE,HYBRID" },
        { name: "XV70 (2017-2024)", yearFrom: 2017, yearTo: 2024, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "RAV4", generations: [
        { name: "XA30 (2005-2012)", yearFrom: 2005, yearTo: 2012, engineTypes: "ICE" },
        { name: "XA40 (2012-2018)", yearFrom: 2012, yearTo: 2018, engineTypes: "ICE" },
        { name: "XA50 (2018-н.в.)", yearFrom: 2018, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Land Cruiser", generations: [
        { name: "200 (2007-2021)", yearFrom: 2007, yearTo: 2021, engineTypes: "ICE" },
        { name: "300 (2021-н.в.)", yearFrom: 2021, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Corolla", generations: [
        { name: "E150 (2006-2013)", yearFrom: 2006, yearTo: 2013, engineTypes: "ICE" },
        { name: "E170 (2013-2018)", yearFrom: 2013, yearTo: 2018, engineTypes: "ICE" },
        { name: "E210 (2018-н.в.)", yearFrom: 2018, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Land Cruiser Prado", generations: [
        { name: "120 (2002-2009)", yearFrom: 2002, yearTo: 2009, engineTypes: "ICE" },
        { name: "150 (2009-2023)", yearFrom: 2009, yearTo: 2023, engineTypes: "ICE" },
        { name: "250 (2023-н.в.)", yearFrom: 2023, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Highlander", generations: [
        { name: "XU50 (2013-2019)", yearFrom: 2013, yearTo: 2019, engineTypes: "ICE,HYBRID" },
        { name: "XU70 (2019-н.в.)", yearFrom: 2019, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
    ],
  },
  {
    brand: "Kia",
    models: [
      { name: "Sportage", generations: [
        { name: "SL (2010-2015)", yearFrom: 2010, yearTo: 2015, engineTypes: "ICE" },
        { name: "QL (2015-2021)", yearFrom: 2015, yearTo: 2021, engineTypes: "ICE" },
        { name: "NQ5 (2021-н.в.)", yearFrom: 2021, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "K5", generations: [
        { name: "DL3 (2019-н.в.)", yearFrom: 2019, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Cerato", generations: [
        { name: "YD (2013-2018)", yearFrom: 2013, yearTo: 2018, engineTypes: "ICE" },
        { name: "BD (2018-н.в.)", yearFrom: 2018, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "Sorento", generations: [
        { name: "XM (2009-2014)", yearFrom: 2009, yearTo: 2014, engineTypes: "ICE" },
        { name: "UM (2014-2020)", yearFrom: 2014, yearTo: 2020, engineTypes: "ICE" },
        { name: "MQ4 (2020-н.в.)", yearFrom: 2020, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Rio", generations: [
        { name: "UB (2011-2017)", yearFrom: 2011, yearTo: 2017, engineTypes: "ICE" },
        { name: "YB (2017-н.в.)", yearFrom: 2017, yearTo: null, engineTypes: "ICE" },
      ]},
    ],
  },
  {
    brand: "Hyundai",
    models: [
      { name: "Tucson", generations: [
        { name: "TL (2015-2020)", yearFrom: 2015, yearTo: 2020, engineTypes: "ICE" },
        { name: "NX4 (2020-н.в.)", yearFrom: 2020, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Sonata", generations: [
        { name: "YF (2009-2014)", yearFrom: 2009, yearTo: 2014, engineTypes: "ICE,HYBRID" },
        { name: "LF (2014-2019)", yearFrom: 2014, yearTo: 2019, engineTypes: "ICE,HYBRID" },
        { name: "DN8 (2019-н.в.)", yearFrom: 2019, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Creta", generations: [
        { name: "GS (2015-2021)", yearFrom: 2015, yearTo: 2021, engineTypes: "ICE" },
        { name: "SU2 (2021-н.в.)", yearFrom: 2021, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "Santa Fe", generations: [
        { name: "DM (2012-2018)", yearFrom: 2012, yearTo: 2018, engineTypes: "ICE" },
        { name: "TM (2018-2023)", yearFrom: 2018, yearTo: 2023, engineTypes: "ICE,HYBRID" },
        { name: "MX5 (2023-н.в.)", yearFrom: 2023, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Elantra", generations: [
        { name: "MD (2010-2015)", yearFrom: 2010, yearTo: 2015, engineTypes: "ICE" },
        { name: "AD (2015-2020)", yearFrom: 2015, yearTo: 2020, engineTypes: "ICE" },
        { name: "CN7 (2020-н.в.)", yearFrom: 2020, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
    ],
  },
  {
    brand: "BMW",
    models: [
      { name: "3 Series", generations: [
        { name: "F30 (2011-2018)", yearFrom: 2011, yearTo: 2018, engineTypes: "ICE" },
        { name: "G20 (2018-н.в.)", yearFrom: 2018, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "5 Series", generations: [
        { name: "F10 (2010-2016)", yearFrom: 2010, yearTo: 2016, engineTypes: "ICE" },
        { name: "G30 (2016-2023)", yearFrom: 2016, yearTo: 2023, engineTypes: "ICE,HYBRID" },
        { name: "G60 (2023-н.в.)", yearFrom: 2023, yearTo: null, engineTypes: "ICE,HYBRID,ELECTRIC" },
      ]},
      { name: "X5", generations: [
        { name: "E70 (2006-2013)", yearFrom: 2006, yearTo: 2013, engineTypes: "ICE" },
        { name: "F15 (2013-2018)", yearFrom: 2013, yearTo: 2018, engineTypes: "ICE,HYBRID" },
        { name: "G05 (2018-н.в.)", yearFrom: 2018, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "X3", generations: [
        { name: "F25 (2010-2017)", yearFrom: 2010, yearTo: 2017, engineTypes: "ICE" },
        { name: "G01 (2017-н.в.)", yearFrom: 2017, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
    ],
  },
  {
    brand: "Mercedes-Benz",
    models: [
      { name: "C-Class", generations: [
        { name: "W204 (2007-2014)", yearFrom: 2007, yearTo: 2014, engineTypes: "ICE" },
        { name: "W205 (2014-2021)", yearFrom: 2014, yearTo: 2021, engineTypes: "ICE,HYBRID" },
        { name: "W206 (2021-н.в.)", yearFrom: 2021, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "E-Class", generations: [
        { name: "W212 (2009-2016)", yearFrom: 2009, yearTo: 2016, engineTypes: "ICE" },
        { name: "W213 (2016-2023)", yearFrom: 2016, yearTo: 2023, engineTypes: "ICE,HYBRID" },
        { name: "W214 (2023-н.в.)", yearFrom: 2023, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "GLE", generations: [
        { name: "W166 (2011-2018)", yearFrom: 2011, yearTo: 2018, engineTypes: "ICE" },
        { name: "V167 (2018-н.в.)", yearFrom: 2018, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
    ],
  },
  {
    brand: "Lexus",
    models: [
      { name: "RX", generations: [
        { name: "AL10 (2008-2015)", yearFrom: 2008, yearTo: 2015, engineTypes: "ICE,HYBRID" },
        { name: "AL20 (2015-2022)", yearFrom: 2015, yearTo: 2022, engineTypes: "ICE,HYBRID" },
        { name: "AL30 (2022-н.в.)", yearFrom: 2022, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "ES", generations: [
        { name: "XV60 (2012-2018)", yearFrom: 2012, yearTo: 2018, engineTypes: "ICE,HYBRID" },
        { name: "XV70 (2018-н.в.)", yearFrom: 2018, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "LX", generations: [
        { name: "570 (2007-2021)", yearFrom: 2007, yearTo: 2021, engineTypes: "ICE" },
        { name: "600 (2021-н.в.)", yearFrom: 2021, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
    ],
  },
  {
    brand: "Chevrolet",
    models: [
      { name: "Cobalt", generations: [
        { name: "T250 (2011-н.в.)", yearFrom: 2011, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "Malibu", generations: [
        { name: "8 (2012-2015)", yearFrom: 2012, yearTo: 2015, engineTypes: "ICE" },
        { name: "9 (2015-н.в.)", yearFrom: 2015, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "Tracker", generations: [
        { name: "2 (2019-н.в.)", yearFrom: 2019, yearTo: null, engineTypes: "ICE" },
      ]},
    ],
  },
  {
    brand: "Volkswagen",
    models: [
      { name: "Polo", generations: [
        { name: "V (2009-2017)", yearFrom: 2009, yearTo: 2017, engineTypes: "ICE" },
        { name: "VI (2017-н.в.)", yearFrom: 2017, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "Tiguan", generations: [
        { name: "I (2007-2016)", yearFrom: 2007, yearTo: 2016, engineTypes: "ICE" },
        { name: "II (2016-н.в.)", yearFrom: 2016, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "Passat", generations: [
        { name: "B7 (2010-2014)", yearFrom: 2010, yearTo: 2014, engineTypes: "ICE" },
        { name: "B8 (2014-н.в.)", yearFrom: 2014, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "ID.4", generations: [
        { name: "1 (2020-н.в.)", yearFrom: 2020, yearTo: null, engineTypes: "ELECTRIC" },
      ]},
    ],
  },
  {
    brand: "Nissan",
    models: [
      { name: "Qashqai", generations: [
        { name: "J10 (2006-2013)", yearFrom: 2006, yearTo: 2013, engineTypes: "ICE" },
        { name: "J11 (2013-2021)", yearFrom: 2013, yearTo: 2021, engineTypes: "ICE" },
        { name: "J12 (2021-н.в.)", yearFrom: 2021, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "X-Trail", generations: [
        { name: "T31 (2007-2013)", yearFrom: 2007, yearTo: 2013, engineTypes: "ICE" },
        { name: "T32 (2013-2021)", yearFrom: 2013, yearTo: 2021, engineTypes: "ICE,HYBRID" },
        { name: "T33 (2021-н.в.)", yearFrom: 2021, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Patrol", generations: [
        { name: "Y62 (2010-н.в.)", yearFrom: 2010, yearTo: null, engineTypes: "ICE" },
      ]},
    ],
  },
  {
    brand: "Lada",
    models: [
      { name: "Vesta", generations: [
        { name: "I (2015-н.в.)", yearFrom: 2015, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "Granta", generations: [
        { name: "I (2011-н.в.)", yearFrom: 2011, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "Niva", generations: [
        { name: "Travel (2020-н.в.)", yearFrom: 2020, yearTo: null, engineTypes: "ICE" },
      ]},
    ],
  },
  {
    brand: "Mitsubishi",
    models: [
      { name: "Outlander", generations: [
        { name: "III (2012-2021)", yearFrom: 2012, yearTo: 2021, engineTypes: "ICE,HYBRID" },
        { name: "IV (2021-н.в.)", yearFrom: 2021, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Pajero", generations: [
        { name: "IV (2006-2021)", yearFrom: 2006, yearTo: 2021, engineTypes: "ICE" },
      ]},
      { name: "L200", generations: [
        { name: "V (2015-н.в.)", yearFrom: 2015, yearTo: null, engineTypes: "ICE" },
      ]},
    ],
  },
  {
    brand: "Honda",
    models: [
      { name: "CR-V", generations: [
        { name: "IV (2011-2016)", yearFrom: 2011, yearTo: 2016, engineTypes: "ICE" },
        { name: "V (2016-2022)", yearFrom: 2016, yearTo: 2022, engineTypes: "ICE,HYBRID" },
        { name: "VI (2022-н.в.)", yearFrom: 2022, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Civic", generations: [
        { name: "X (2015-2021)", yearFrom: 2015, yearTo: 2021, engineTypes: "ICE" },
        { name: "XI (2021-н.в.)", yearFrom: 2021, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
    ],
  },
  {
    brand: "Mazda",
    models: [
      { name: "CX-5", generations: [
        { name: "KE (2011-2017)", yearFrom: 2011, yearTo: 2017, engineTypes: "ICE" },
        { name: "KF (2017-н.в.)", yearFrom: 2017, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "6", generations: [
        { name: "GJ (2012-н.в.)", yearFrom: 2012, yearTo: null, engineTypes: "ICE" },
      ]},
    ],
  },
  {
    brand: "Audi",
    models: [
      { name: "A4", generations: [
        { name: "B8 (2007-2015)", yearFrom: 2007, yearTo: 2015, engineTypes: "ICE" },
        { name: "B9 (2015-н.в.)", yearFrom: 2015, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "Q7", generations: [
        { name: "4L (2005-2015)", yearFrom: 2005, yearTo: 2015, engineTypes: "ICE" },
        { name: "4M (2015-н.в.)", yearFrom: 2015, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Q5", generations: [
        { name: "8R (2008-2016)", yearFrom: 2008, yearTo: 2016, engineTypes: "ICE,HYBRID" },
        { name: "FY (2016-н.в.)", yearFrom: 2016, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
    ],
  },
  {
    brand: "Subaru",
    models: [
      { name: "Outback", generations: [
        { name: "V (2014-2019)", yearFrom: 2014, yearTo: 2019, engineTypes: "ICE" },
        { name: "VI (2019-н.в.)", yearFrom: 2019, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "Forester", generations: [
        { name: "SJ (2012-2018)", yearFrom: 2012, yearTo: 2018, engineTypes: "ICE" },
        { name: "SK (2018-н.в.)", yearFrom: 2018, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
    ],
  },
  {
    brand: "Skoda",
    models: [
      { name: "Octavia", generations: [
        { name: "A7 (2012-2019)", yearFrom: 2012, yearTo: 2019, engineTypes: "ICE" },
        { name: "A8 (2019-н.в.)", yearFrom: 2019, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "Rapid", generations: [
        { name: "NH (2012-2019)", yearFrom: 2012, yearTo: 2019, engineTypes: "ICE" },
      ]},
      { name: "Kodiaq", generations: [
        { name: "NS (2016-н.в.)", yearFrom: 2016, yearTo: null, engineTypes: "ICE" },
      ]},
    ],
  },
  {
    brand: "Changan",
    models: [
      { name: "CS55", generations: [
        { name: "Plus (2019-н.в.)", yearFrom: 2019, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "CS75", generations: [
        { name: "Plus (2019-н.в.)", yearFrom: 2019, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "UNI-V", generations: [
        { name: "I (2021-н.в.)", yearFrom: 2021, yearTo: null, engineTypes: "ICE" },
      ]},
    ],
  },
  {
    brand: "Geely",
    models: [
      { name: "Coolray", generations: [
        { name: "SX11 (2019-н.в.)", yearFrom: 2019, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "Atlas", generations: [
        { name: "NL3 (2016-н.в.)", yearFrom: 2016, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "Monjaro", generations: [
        { name: "KX11 (2021-н.в.)", yearFrom: 2021, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
    ],
  },
  {
    brand: "Haval",
    models: [
      { name: "Jolion", generations: [
        { name: "I (2020-н.в.)", yearFrom: 2020, yearTo: null, engineTypes: "ICE,HYBRID" },
      ]},
      { name: "F7", generations: [
        { name: "I (2018-н.в.)", yearFrom: 2018, yearTo: null, engineTypes: "ICE" },
      ]},
      { name: "Dargo", generations: [
        { name: "I (2021-н.в.)", yearFrom: 2021, yearTo: null, engineTypes: "ICE" },
      ]},
    ],
  },
];

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  // Очищаем каталог
  await prisma.carGeneration.deleteMany();
  await prisma.carModel.deleteMany();
  await prisma.carBrand.deleteMany();

  let brandsCount = 0;
  let modelsCount = 0;
  let generationsCount = 0;

  for (const entry of catalog) {
    const brand = await prisma.carBrand.create({ data: { name: entry.brand } });
    brandsCount++;

    for (const m of entry.models) {
      const model = await prisma.carModel.create({
        data: { name: m.name, brandId: brand.id },
      });
      modelsCount++;

      for (const g of m.generations) {
        await prisma.carGeneration.create({
          data: {
            name: g.name,
            yearFrom: g.yearFrom,
            yearTo: g.yearTo,
            engineTypes: g.engineTypes,
            modelId: model.id,
          },
        });
        generationsCount++;
      }
    }
  }

  return NextResponse.json({
    message: "Car catalog seeded!",
    brands: brandsCount,
    models: modelsCount,
    generations: generationsCount,
  });
}
