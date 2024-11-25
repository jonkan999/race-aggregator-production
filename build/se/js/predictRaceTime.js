function predictRaceTime(distance, time) {
  // Find the closest matching input combination
  const lookupTable = [
    {
      input_distance: 5.0,
      input_time: 780.0,
      predictions: [
        {
          distance: 4.0,
          pace: 248.00000000000006,
        },
        {
          distance: 5.0,
          pace: 251.0,
        },
        {
          distance: 6.0,
          pace: 253.33333333333331,
        },
        {
          distance: 7.0,
          pace: 255.66666666666669,
        },
        {
          distance: 8.0,
          pace: 258.0,
        },
        {
          distance: 9.0,
          pace: 259.9521834843598,
        },
        {
          distance: 10.0,
          pace: 262.0,
        },
        {
          distance: 11.0,
          pace: 263.5,
        },
        {
          distance: 12.0,
          pace: 265.0,
        },
        {
          distance: 13.0,
          pace: 266.0,
        },
        {
          distance: 14.0,
          pace: 267.0,
        },
        {
          distance: 15.0,
          pace: 268.0,
        },
        {
          distance: 16.0,
          pace: 268.91457837936713,
        },
        {
          distance: 17.0,
          pace: 269.9058571970984,
        },
        {
          distance: 18.0,
          pace: 270.9050378689475,
        },
        {
          distance: 19.0,
          pace: 271.9042185407966,
        },
        {
          distance: 20.0,
          pace: 272.90339921264564,
        },
        {
          distance: 21.0,
          pace: 273.90257988449474,
        },
        {
          distance: 22.0,
          pace: 274.5561085436663,
        },
        {
          distance: 23.0,
          pace: 275.1722952956511,
        },
        {
          distance: 24.0,
          pace: 275.78848204763597,
        },
        {
          distance: 25.0,
          pace: 276.4046687996208,
        },
        {
          distance: 26.0,
          pace: 277.0208555516057,
        },
        {
          distance: 27.0,
          pace: 277.6370423035905,
        },
        {
          distance: 28.0,
          pace: 278.25322905557533,
        },
        {
          distance: 29.0,
          pace: 278.86941580756013,
        },
        {
          distance: 30.0,
          pace: 279.485602559545,
        },
        {
          distance: 31.0,
          pace: 280.1017893115298,
        },
        {
          distance: 32.0,
          pace: 280.7179760635147,
        },
        {
          distance: 33.0,
          pace: 281.33416281549944,
        },
        {
          distance: 34.0,
          pace: 281.9503495674843,
        },
        {
          distance: 35.0,
          pace: 282.56653631946915,
        },
        {
          distance: 36.0,
          pace: 283.182723071454,
        },
        {
          distance: 37.0,
          pace: 283.7989098234388,
        },
        {
          distance: 38.0,
          pace: 284.4150965754236,
        },
        {
          distance: 39.0,
          pace: 285.03128332740846,
        },
        {
          distance: 40.0,
          pace: 285.6474700793933,
        },
        {
          distance: 41.0,
          pace: 286.2636568313781,
        },
        {
          distance: 42.0,
          pace: 286.87984358336297,
        },
      ],
    },
    {
      input_distance: 10.0,
      input_time: 3093.3333333333335,
      predictions: [
        {
          distance: 4.0,
          pace: 471.3111111111112,
        },
        {
          distance: 5.0,
          pace: 477.31111111111113,
        },
        {
          distance: 6.0,
          pace: 482.26666666666677,
        },
        {
          distance: 7.0,
          pace: 486.60000000000014,
        },
        {
          distance: 8.0,
          pace: 490.93333333333345,
        },
        {
          distance: 9.0,
          pace: 494.86160855987316,
        },
        {
          distance: 10.0,
          pace: 497.9333333333335,
        },
        {
          distance: 11.0,
          pace: 500.7444444444446,
        },
        {
          distance: 12.0,
          pace: 503.2444444444446,
        },
        {
          distance: 13.0,
          pace: 505.5777777777779,
        },
        {
          distance: 14.0,
          pace: 507.91111111111127,
        },
        {
          distance: 15.0,
          pace: 510.2444444444446,
        },
        {
          distance: 16.0,
          pace: 512.0736012031788,
        },
        {
          distance: 17.0,
          pace: 513.693815959802,
        },
        {
          distance: 18.0,
          pace: 515.2925050347606,
        },
        {
          distance: 19.0,
          pace: 516.8911941097191,
        },
        {
          distance: 20.0,
          pace: 518.5816741383178,
        },
        {
          distance: 21.0,
          pace: 520.3801993476462,
        },
        {
          distance: 22.0,
          pace: 524.0205395583997,
        },
        {
          distance: 23.0,
          pace: 527.8598570130744,
        },
        {
          distance: 24.0,
          pace: 531.699174467749,
        },
        {
          distance: 25.0,
          pace: 535.5384919224238,
        },
        {
          distance: 26.0,
          pace: 539.3778093770985,
        },
        {
          distance: 27.0,
          pace: 543.2171268317733,
        },
        {
          distance: 28.0,
          pace: 547.056444286448,
        },
        {
          distance: 29.0,
          pace: 550.8957617411228,
        },
        {
          distance: 30.0,
          pace: 554.7350791957974,
        },
        {
          distance: 31.0,
          pace: 558.5743966504722,
        },
        {
          distance: 32.0,
          pace: 562.4137141051468,
        },
        {
          distance: 33.0,
          pace: 566.2530315598216,
        },
        {
          distance: 34.0,
          pace: 570.0923490144963,
        },
        {
          distance: 35.0,
          pace: 573.9316664691711,
        },
        {
          distance: 36.0,
          pace: 578.1728956827429,
        },
        {
          distance: 37.0,
          pace: 583.1023896986216,
        },
        {
          distance: 38.0,
          pace: 588.0318837145002,
        },
        {
          distance: 39.0,
          pace: 592.9613777303789,
        },
        {
          distance: 40.0,
          pace: 597.8908717462575,
        },
        {
          distance: 41.0,
          pace: 602.8203657621361,
        },
        {
          distance: 42.0,
          pace: 607.7498597780148,
        },
      ],
    },
    {
      input_distance: 21.0975,
      input_time: 5406.666666666667,
      predictions: [
        {
          distance: 4.0,
          pace: 373.459959551911,
        },
        {
          distance: 5.0,
          pace: 378.4599358518589,
        },
        {
          distance: 6.0,
          pace: 382.12650771831704,
        },
        {
          distance: 7.0,
          pace: 385.7931743849837,
        },
        {
          distance: 8.0,
          pace: 389.45984105165036,
        },
        {
          distance: 9.0,
          pace: 391.92207932885304,
        },
        {
          distance: 10.0,
          pace: 394.4818499734033,
        },
        {
          distance: 11.0,
          pace: 396.4818499734033,
        },
        {
          distance: 12.0,
          pace: 398.4818262733512,
        },
        {
          distance: 13.0,
          pace: 400.4818262733512,
        },
        {
          distance: 14.0,
          pace: 402.48182627335115,
        },
        {
          distance: 15.0,
          pace: 404.48177887324687,
        },
        {
          distance: 16.0,
          pace: 405.418389874419,
        },
        {
          distance: 17.0,
          pace: 406.7719404708333,
        },
        {
          distance: 18.0,
          pace: 408.170793411422,
        },
        {
          distance: 19.0,
          pace: 409.56964635201075,
        },
        {
          distance: 20.0,
          pace: 410.96849929259946,
        },
        {
          distance: 21.0,
          pace: 412.36735223318817,
        },
        {
          distance: 22.0,
          pace: 414.66851502078646,
        },
        {
          distance: 23.0,
          pace: 416.8962671241162,
        },
        {
          distance: 24.0,
          pace: 419.12401922744596,
        },
        {
          distance: 25.0,
          pace: 421.3517713307758,
        },
        {
          distance: 26.0,
          pace: 423.57952343410557,
        },
        {
          distance: 27.0,
          pace: 425.8072755374354,
        },
        {
          distance: 28.0,
          pace: 428.0350276407651,
        },
        {
          distance: 29.0,
          pace: 430.26277974409487,
        },
        {
          distance: 30.0,
          pace: 432.4905318474246,
        },
        {
          distance: 31.0,
          pace: 434.7182839507544,
        },
        {
          distance: 32.0,
          pace: 436.9460360540842,
        },
        {
          distance: 33.0,
          pace: 439.173788157414,
        },
        {
          distance: 34.0,
          pace: 441.40154026074373,
        },
        {
          distance: 35.0,
          pace: 443.62929236407354,
        },
        {
          distance: 36.0,
          pace: 445.8570444674033,
        },
        {
          distance: 37.0,
          pace: 448.0847965707331,
        },
        {
          distance: 38.0,
          pace: 450.3125486740629,
        },
        {
          distance: 39.0,
          pace: 452.54030077739264,
        },
        {
          distance: 40.0,
          pace: 454.76805288072245,
        },
        {
          distance: 41.0,
          pace: 456.9958049840522,
        },
        {
          distance: 42.0,
          pace: 459.22355708738195,
        },
      ],
    },
    {
      input_distance: 21.0975,
      input_time: 7720.0,
      predictions: [
        {
          distance: 4.0,
          pace: 533.3933402853487,
        },
        {
          distance: 5.0,
          pace: 540.3932691851923,
        },
        {
          distance: 6.0,
          pace: 545.2597462514418,
        },
        {
          distance: 7.0,
          pace: 550.2597462514418,
        },
        {
          distance: 8.0,
          pace: 555.2597462514418,
        },
        {
          distance: 9.0,
          pace: 559.542710315686,
        },
        {
          distance: 10.0,
          pace: 563.1263181178998,
        },
        {
          distance: 11.0,
          pace: 566.1263181178999,
        },
        {
          distance: 12.0,
          pace: 569.1262470177435,
        },
        {
          distance: 13.0,
          pace: 571.7929136844101,
        },
        {
          distance: 14.0,
          pace: 574.4595803510769,
        },
        {
          distance: 15.0,
          pace: 576.9928188842015,
        },
        {
          distance: 16.0,
          pace: 578.8219519428836,
        },
        {
          distance: 17.0,
          pace: 580.6711762450128,
        },
        {
          distance: 18.0,
          pace: 582.669537588711,
        },
        {
          distance: 19.0,
          pace: 584.6678989324091,
        },
        {
          distance: 20.0,
          pace: 586.6662602761073,
        },
        {
          distance: 21.0,
          pace: 588.6646216198055,
        },
        {
          distance: 22.0,
          pace: 594.1209620251923,
        },
        {
          distance: 23.0,
          pace: 599.9510366785871,
        },
        {
          distance: 24.0,
          pace: 605.7811113319822,
        },
        {
          distance: 25.0,
          pace: 611.6111859853771,
        },
        {
          distance: 26.0,
          pace: 617.4412606387721,
        },
        {
          distance: 27.0,
          pace: 623.271335292167,
        },
        {
          distance: 28.0,
          pace: 629.101409945562,
        },
        {
          distance: 29.0,
          pace: 634.931484598957,
        },
        {
          distance: 30.0,
          pace: 640.7615592523518,
        },
        {
          distance: 31.0,
          pace: 646.5916339057467,
        },
        {
          distance: 32.0,
          pace: 652.4217085591416,
        },
        {
          distance: 33.0,
          pace: 658.2517832125367,
        },
        {
          distance: 34.0,
          pace: 664.0818578659315,
        },
        {
          distance: 35.0,
          pace: 669.9119325193266,
        },
        {
          distance: 36.0,
          pace: 675.7420071727214,
        },
        {
          distance: 37.0,
          pace: 681.5720818261165,
        },
        {
          distance: 38.0,
          pace: 687.4021564795114,
        },
        {
          distance: 39.0,
          pace: 693.2322311329063,
        },
        {
          distance: 40.0,
          pace: 698.4152622359516,
        },
        {
          distance: 41.0,
          pace: 703.2025593090646,
        },
        {
          distance: 42.0,
          pace: 707.9898563821774,
        },
      ],
    },
    {
      input_distance: 21.0975,
      input_time: 10033.333333333334,
      predictions: [
        {
          distance: 4.0,
          pace: 683.9942847049621,
        },
        {
          distance: 5.0,
          pace: 693.8762323911577,
        },
        {
          distance: 6.0,
          pace: 700.5149442979524,
        },
        {
          distance: 7.0,
          pace: 707.181610964619,
        },
        {
          distance: 8.0,
          pace: 713.8482776312857,
        },
        {
          distance: 9.0,
          pace: 718.3587427848995,
        },
        {
          distance: 10.0,
          pace: 723.0564274990222,
        },
        {
          distance: 11.0,
          pace: 727.0564274990222,
        },
        {
          distance: 12.0,
          pace: 730.9383751852179,
        },
        {
          distance: 13.0,
          pace: 734.2717085185512,
        },
        {
          distance: 14.0,
          pace: 737.6050418518846,
        },
        {
          distance: 15.0,
          pace: 740.9383751852179,
        },
        {
          distance: 16.0,
          pace: 743.6867862566186,
        },
        {
          distance: 17.0,
          pace: 746.2025300121863,
        },
        {
          distance: 18.0,
          pace: 748.6005636246241,
        },
        {
          distance: 19.0,
          pace: 750.9985972370619,
        },
        {
          distance: 20.0,
          pace: 753.3966308494996,
        },
        {
          distance: 21.0,
          pace: 755.7946644619375,
        },
        {
          distance: 22.0,
          pace: 757.482910468739,
        },
        {
          distance: 23.0,
          pace: 759.1094081944364,
        },
        {
          distance: 24.0,
          pace: 769.6793809400224,
        },
        {
          distance: 25.0,
          pace: 780.2493536856084,
        },
        {
          distance: 26.0,
          pace: 790.8193264311943,
        },
        {
          distance: 27.0,
          pace: 801.3892991767804,
        },
        {
          distance: 28.0,
          pace: 811.9592719223663,
        },
        {
          distance: 29.0,
          pace: 822.5292446679522,
        },
        {
          distance: 30.0,
          pace: 833.0992174135382,
        },
        {
          distance: 31.0,
          pace: 843.6691901591241,
        },
        {
          distance: 32.0,
          pace: 854.2391629047103,
        },
        {
          distance: 33.0,
          pace: 864.8091356502962,
        },
        {
          distance: 34.0,
          pace: 875.3791083958821,
        },
        {
          distance: 35.0,
          pace: 885.949081141468,
        },
        {
          distance: 36.0,
          pace: 896.5190538870542,
        },
        {
          distance: 37.0,
          pace: 907.0890266326401,
        },
        {
          distance: 38.0,
          pace: 917.6589993782259,
        },
        {
          distance: 39.0,
          pace: 928.228972123812,
        },
        {
          distance: 40.0,
          pace: 938.616794710548,
        },
        {
          distance: 41.0,
          pace: 948.5705807041492,
        },
        {
          distance: 42.0,
          pace: 958.5243666977502,
        },
      ],
    },
  ];
  let bestMatch = lookupTable[0];
  let minDiff = Infinity;

  for (const entry of lookupTable) {
    const timeDiff = Math.abs(entry.input_time - time);
    const distDiff = Math.abs(entry.input_distance - distance);
    const totalDiff = timeDiff / time + distDiff / distance; // Normalized difference

    if (totalDiff < minDiff) {
      minDiff = totalDiff;
      bestMatch = entry;
    }
  }

  // Return the predictions for this input combination
  return bestMatch.predictions.map((pred) => ({
    distance: pred.distance,
    pace: pred.pace,
    time: formatTime(pred.pace * pred.distance),
  }));
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}