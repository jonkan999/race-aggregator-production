// Helper functions
export function formatTime(seconds) {
  if (isNaN(seconds)) return 'N/A';

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

export function calculateHillAdjustment(basePaceSeconds) {
  // Convert pace to min/km if it's in min/mile
  const pacePerKm =
    basePaceSeconds < 600 ? basePaceSeconds : basePaceSeconds / 1.60934;

  // Base adjustment is 12s/km for 4:00/km runners
  const baseAdjustment = 12;

  // Scale factor based on pace (1.0 for 4:00/km, 2.0 for 5:30/km, 3.0 for 7:00/km)
  let paceFactor = (pacePerKm - 240) / 90 + 1.0; // 240s = 4:00, increases by 1.0 every 90s
  paceFactor = Math.max(1.0, Math.min(3.0, paceFactor)); // Clamp between 1.0 and 3.0

  return baseAdjustment * paceFactor;
}

export function interpolate(x, x1, x2, y1, y2) {
  return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
}

export function predictRaceTime(distance, time, isHilly = false) {
  const lookupTable = [
    {
      input_distance: 5.0,
      input_time: 780.0,
      predictions: [
        {
          distance: 4.0,
          pace: 248.00000000000003,
        },
        {
          distance: 5.0,
          pace: 251.00000000000003,
        },
        {
          distance: 6.0,
          pace: 253.33333333333337,
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
          pace: 259.95218348435986,
        },
        {
          distance: 10.0,
          pace: 262.0,
        },
        {
          distance: 11.0,
          pace: 263.50000000000006,
        },
        {
          distance: 12.0,
          pace: 265.00000000000006,
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
          pace: 269.9059477176433,
        },
        {
          distance: 18.0,
          pace: 270.90522823567034,
        },
        {
          distance: 19.0,
          pace: 271.90450875369737,
        },
        {
          distance: 20.0,
          pace: 272.90378927172435,
        },
        {
          distance: 21.0,
          pace: 273.9030697897514,
        },
        {
          distance: 22.0,
          pace: 274.55642982414565,
        },
        {
          distance: 23.0,
          pace: 275.1726311797886,
        },
        {
          distance: 24.0,
          pace: 275.7888325354316,
        },
        {
          distance: 25.0,
          pace: 276.40503389107454,
        },
        {
          distance: 26.0,
          pace: 277.02123524671754,
        },
        {
          distance: 27.0,
          pace: 277.6374366023605,
        },
        {
          distance: 28.0,
          pace: 278.25363795800354,
        },
        {
          distance: 29.0,
          pace: 278.8698393136465,
        },
        {
          distance: 30.0,
          pace: 279.4860406692895,
        },
        {
          distance: 31.0,
          pace: 280.1022420249325,
        },
        {
          distance: 32.0,
          pace: 280.7184433805754,
        },
        {
          distance: 33.0,
          pace: 281.3346447362184,
        },
        {
          distance: 34.0,
          pace: 281.9508460918614,
        },
        {
          distance: 35.0,
          pace: 282.56704744750436,
        },
        {
          distance: 36.0,
          pace: 283.1832488031473,
        },
        {
          distance: 37.0,
          pace: 283.79945015879036,
        },
        {
          distance: 38.0,
          pace: 284.4156515144333,
        },
        {
          distance: 39.0,
          pace: 285.0318528700763,
        },
        {
          distance: 40.0,
          pace: 285.6480542257193,
        },
        {
          distance: 41.0,
          pace: 286.2642555813623,
        },
        {
          distance: 42.0,
          pace: 286.88045693700525,
        },
      ],
    },
    {
      input_distance: 5.0,
      input_time: 1875.7894736842106,
      predictions: [
        {
          distance: 4.0,
          pace: 596.0,
        },
        {
          distance: 5.0,
          pace: 604.0,
        },
        {
          distance: 6.0,
          pace: 609.9298245614035,
        },
        {
          distance: 7.0,
          pace: 615.5964912280702,
        },
        {
          distance: 8.0,
          pace: 621.2631578947369,
        },
        {
          distance: 9.0,
          pace: 625.1675248634565,
        },
        {
          distance: 10.0,
          pace: 629.2631578947369,
        },
        {
          distance: 11.0,
          pace: 632.8947368421053,
        },
        {
          distance: 12.0,
          pace: 636.3947368421053,
        },
        {
          distance: 13.0,
          pace: 639.061403508772,
        },
        {
          distance: 14.0,
          pace: 641.7280701754387,
        },
        {
          distance: 15.0,
          pace: 644.5263157894736,
        },
        {
          distance: 16.0,
          pace: 647.2700509275751,
        },
        {
          distance: 17.0,
          pace: 649.519400768289,
        },
        {
          distance: 18.0,
          pace: 651.7178179079484,
        },
        {
          distance: 19.0,
          pace: 653.9162350476079,
        },
        {
          distance: 20.0,
          pace: 656.1146521872673,
        },
        {
          distance: 21.0,
          pace: 658.3130693269267,
        },
        {
          distance: 22.0,
          pace: 666.2735310333474,
        },
        {
          distance: 23.0,
          pace: 674.8529499080688,
        },
        {
          distance: 24.0,
          pace: 683.2757563435063,
        },
        {
          distance: 25.0,
          pace: 690.6227725069417,
        },
        {
          distance: 26.0,
          pace: 697.9697886703773,
        },
        {
          distance: 27.0,
          pace: 705.3168048338129,
        },
        {
          distance: 28.0,
          pace: 712.6638209972484,
        },
        {
          distance: 29.0,
          pace: 720.010837160684,
        },
        {
          distance: 30.0,
          pace: 727.3578533241196,
        },
        {
          distance: 31.0,
          pace: 734.7048694875551,
        },
        {
          distance: 32.0,
          pace: 742.0518856509906,
        },
        {
          distance: 33.0,
          pace: 749.3989018144263,
        },
        {
          distance: 34.0,
          pace: 756.7459179778617,
        },
        {
          distance: 35.0,
          pace: 764.0929341412973,
        },
        {
          distance: 36.0,
          pace: 771.4399503047329,
        },
        {
          distance: 37.0,
          pace: 778.7869664681684,
        },
        {
          distance: 38.0,
          pace: 786.133982631604,
        },
        {
          distance: 39.0,
          pace: 793.4809987950396,
        },
        {
          distance: 40.0,
          pace: 800.8280149584751,
        },
        {
          distance: 41.0,
          pace: 808.1750311219107,
        },
        {
          distance: 42.0,
          pace: 815.5220472853463,
        },
      ],
    },
    {
      input_distance: 10.0,
      input_time: 1875.7894736842106,
      predictions: [
        {
          distance: 4.0,
          pace: 285.5000000000001,
        },
        {
          distance: 5.0,
          pace: 289.5,
        },
        {
          distance: 6.0,
          pace: 292.1666666666667,
        },
        {
          distance: 7.0,
          pace: 294.83333333333337,
        },
        {
          distance: 8.0,
          pace: 297.5,
        },
        {
          distance: 9.0,
          pace: 299.5837624317283,
        },
        {
          distance: 10.0,
          pace: 301.6315789473685,
        },
        {
          distance: 11.0,
          pace: 303.5,
        },
        {
          distance: 12.0,
          pace: 305.50000000000006,
        },
        {
          distance: 13.0,
          pace: 306.83333333333337,
        },
        {
          distance: 14.0,
          pace: 308.1666666666667,
        },
        {
          distance: 15.0,
          pace: 309.50000000000006,
        },
        {
          distance: 16.0,
          pace: 310.54615732673557,
        },
        {
          distance: 17.0,
          pace: 311.5375266650118,
        },
        {
          distance: 18.0,
          pace: 312.53680718303883,
        },
        {
          distance: 19.0,
          pace: 313.53608770106587,
        },
        {
          distance: 20.0,
          pace: 314.53536821909285,
        },
        {
          distance: 21.0,
          pace: 315.5346487371198,
        },
        {
          distance: 22.0,
          pace: 316.74443859565974,
        },
        {
          distance: 23.0,
          pace: 317.9768413069457,
        },
        {
          distance: 24.0,
          pace: 319.1791262414463,
        },
        {
          distance: 25.0,
          pace: 320.17452843133105,
        },
        {
          distance: 26.0,
          pace: 321.1699306212159,
        },
        {
          distance: 27.0,
          pace: 322.1653328111007,
        },
        {
          distance: 28.0,
          pace: 323.16073500098554,
        },
        {
          distance: 29.0,
          pace: 324.1561371908703,
        },
        {
          distance: 30.0,
          pace: 325.15153938075514,
        },
        {
          distance: 31.0,
          pace: 326.14694157063997,
        },
        {
          distance: 32.0,
          pace: 327.1423437605248,
        },
        {
          distance: 33.0,
          pace: 328.1377459504096,
        },
        {
          distance: 34.0,
          pace: 329.13314814029445,
        },
        {
          distance: 35.0,
          pace: 330.1285503301792,
        },
        {
          distance: 36.0,
          pace: 331.123952520064,
        },
        {
          distance: 37.0,
          pace: 332.1193547099489,
        },
        {
          distance: 38.0,
          pace: 333.1147568998337,
        },
        {
          distance: 39.0,
          pace: 334.11015908971854,
        },
        {
          distance: 40.0,
          pace: 335.1055612796033,
        },
        {
          distance: 41.0,
          pace: 336.10096346948814,
        },
        {
          distance: 42.0,
          pace: 337.09636565937296,
        },
      ],
    },
    {
      input_distance: 10.0,
      input_time: 2971.5789473684213,
      predictions: [
        {
          distance: 4.0,
          pace: 452.64210526315793,
        },
        {
          distance: 5.0,
          pace: 458.6421052631578,
        },
        {
          distance: 6.0,
          pace: 462.97543859649113,
        },
        {
          distance: 7.0,
          pace: 467.3087719298245,
        },
        {
          distance: 8.0,
          pace: 471.54736842105257,
        },
        {
          distance: 9.0,
          pace: 475.38090680548703,
        },
        {
          distance: 10.0,
          pace: 478.45263157894726,
        },
        {
          distance: 11.0,
          pace: 480.8578947368421,
        },
        {
          distance: 12.0,
          pace: 483.3578947368421,
        },
        {
          distance: 13.0,
          pace: 485.59649122807025,
        },
        {
          distance: 14.0,
          pace: 487.92982456140356,
        },
        {
          distance: 15.0,
          pace: 490.2631578947369,
        },
        {
          distance: 16.0,
          pace: 492.09231465347113,
        },
        {
          distance: 17.0,
          pace: 493.7126742429661,
        },
        {
          distance: 18.0,
          pace: 495.31152307180935,
        },
        {
          distance: 19.0,
          pace: 496.91037190065265,
        },
        {
          distance: 20.0,
          pace: 498.50922072949584,
        },
        {
          distance: 21.0,
          pace: 500.0327187582835,
        },
        {
          distance: 22.0,
          pace: 502.8221632908645,
        },
        {
          distance: 23.0,
          pace: 505.76096975623875,
        },
        {
          distance: 24.0,
          pace: 509.51422377339765,
        },
        {
          distance: 25.0,
          pace: 513.3536322200962,
        },
        {
          distance: 26.0,
          pace: 517.1930406667948,
        },
        {
          distance: 27.0,
          pace: 521.0324491134934,
        },
        {
          distance: 28.0,
          pace: 524.871857560192,
        },
        {
          distance: 29.0,
          pace: 528.7112660068906,
        },
        {
          distance: 30.0,
          pace: 532.5506744535891,
        },
        {
          distance: 31.0,
          pace: 536.3900829002877,
        },
        {
          distance: 32.0,
          pace: 540.2294913469863,
        },
        {
          distance: 33.0,
          pace: 544.0688997936847,
        },
        {
          distance: 34.0,
          pace: 547.9083082403835,
        },
        {
          distance: 35.0,
          pace: 551.7477166870821,
        },
        {
          distance: 36.0,
          pace: 555.5871251337807,
        },
        {
          distance: 37.0,
          pace: 559.4265335804791,
        },
        {
          distance: 38.0,
          pace: 563.2659420271777,
        },
        {
          distance: 39.0,
          pace: 567.1053504738763,
        },
        {
          distance: 40.0,
          pace: 570.9447589205749,
        },
        {
          distance: 41.0,
          pace: 574.7841673672735,
        },
        {
          distance: 42.0,
          pace: 578.623575813972,
        },
      ],
    },
    {
      input_distance: 10.0,
      input_time: 4067.3684210526317,
      predictions: [
        {
          distance: 4.0,
          pace: 619.6631578947367,
        },
        {
          distance: 5.0,
          pace: 627.6631578947367,
        },
        {
          distance: 6.0,
          pace: 633.3333333333333,
        },
        {
          distance: 7.0,
          pace: 639.6666666666667,
        },
        {
          distance: 8.0,
          pace: 645.9999999999999,
        },
        {
          distance: 9.0,
          pace: 649.9503075766515,
        },
        {
          distance: 10.0,
          pace: 654.557894736842,
        },
        {
          distance: 11.0,
          pace: 658.0578947368422,
        },
        {
          distance: 12.0,
          pace: 661.5578947368422,
        },
        {
          distance: 13.0,
          pace: 664.8912280701754,
        },
        {
          distance: 14.0,
          pace: 668.2245614035088,
        },
        {
          distance: 15.0,
          pace: 671.1157894736842,
        },
        {
          distance: 16.0,
          pace: 672.9449462324185,
        },
        {
          distance: 17.0,
          pace: 674.9276849089708,
        },
        {
          distance: 18.0,
          pace: 677.2462319761352,
        },
        {
          distance: 19.0,
          pace: 679.6445052194,
        },
        {
          distance: 20.0,
          pace: 682.0427784626647,
        },
        {
          distance: 21.0,
          pace: 684.4410517059296,
        },
        {
          distance: 22.0,
          pace: 690.1951801578175,
        },
        {
          distance: 23.0,
          pace: 696.309793609967,
        },
        {
          distance: 24.0,
          pace: 702.4244070621166,
        },
        {
          distance: 25.0,
          pace: 708.5390205142662,
        },
        {
          distance: 26.0,
          pace: 715.3346387488368,
        },
        {
          distance: 27.0,
          pace: 724.2932584578002,
        },
        {
          distance: 28.0,
          pace: 733.2518781667636,
        },
        {
          distance: 29.0,
          pace: 742.210497875727,
        },
        {
          distance: 30.0,
          pace: 751.1691175846903,
        },
        {
          distance: 31.0,
          pace: 760.1277372936536,
        },
        {
          distance: 32.0,
          pace: 769.086357002617,
        },
        {
          distance: 33.0,
          pace: 778.0449767115804,
        },
        {
          distance: 34.0,
          pace: 787.0035964205438,
        },
        {
          distance: 35.0,
          pace: 795.962216129507,
        },
        {
          distance: 36.0,
          pace: 804.9208358384705,
        },
        {
          distance: 37.0,
          pace: 813.8794555474338,
        },
        {
          distance: 38.0,
          pace: 822.8380752563971,
        },
        {
          distance: 39.0,
          pace: 831.7966949653605,
        },
        {
          distance: 40.0,
          pace: 840.7553146743238,
        },
        {
          distance: 41.0,
          pace: 849.7139343832872,
        },
        {
          distance: 42.0,
          pace: 858.6725540922506,
        },
      ],
    },
    {
      input_distance: 21.0975,
      input_time: 4067.3684210526317,
      predictions: [
        {
          distance: 4.0,
          pace: 280.7090586588765,
        },
        {
          distance: 5.0,
          pace: 284.7090586588764,
        },
        {
          distance: 6.0,
          pace: 287.3757253255431,
        },
        {
          distance: 7.0,
          pace: 290.0423682921577,
        },
        {
          distance: 8.0,
          pace: 292.7090349588243,
        },
        {
          distance: 9.0,
          pace: 294.2188287794005,
        },
        {
          distance: 10.0,
          pace: 296.26664529504075,
        },
        {
          distance: 11.0,
          pace: 298.2666452950407,
        },
        {
          distance: 12.0,
          pace: 300.26662159498864,
        },
        {
          distance: 13.0,
          pace: 301.2666215949886,
        },
        {
          distance: 14.0,
          pace: 302.4908985978717,
        },
        {
          distance: 15.0,
          pace: 303.8242319312051,
        },
        {
          distance: 16.0,
          pace: 305.09580205377495,
        },
        {
          distance: 17.0,
          pace: 306.1725456125797,
        },
        {
          distance: 18.0,
          pace: 307.17182613060675,
        },
        {
          distance: 19.0,
          pace: 308.1711066486338,
        },
        {
          distance: 20.0,
          pace: 309.1703871666608,
        },
        {
          distance: 21.0,
          pace: 310.16966768468785,
        },
        {
          distance: 22.0,
          pace: 310.99423689574223,
        },
        {
          distance: 23.0,
          pace: 311.8000386685062,
        },
        {
          distance: 24.0,
          pace: 312.60584044127006,
        },
        {
          distance: 25.0,
          pace: 313.411642214034,
        },
        {
          distance: 26.0,
          pace: 314.2174439867979,
        },
        {
          distance: 27.0,
          pace: 315.02324575956175,
        },
        {
          distance: 28.0,
          pace: 315.82904753232566,
        },
        {
          distance: 29.0,
          pace: 316.6348493050896,
        },
        {
          distance: 30.0,
          pace: 317.4406510778535,
        },
        {
          distance: 31.0,
          pace: 318.40829726351717,
        },
        {
          distance: 32.0,
          pace: 319.4984996619624,
        },
        {
          distance: 33.0,
          pace: 320.5887020604077,
        },
        {
          distance: 34.0,
          pace: 321.67890445885297,
        },
        {
          distance: 35.0,
          pace: 322.76910685729825,
        },
        {
          distance: 36.0,
          pace: 323.85930925574354,
        },
        {
          distance: 37.0,
          pace: 324.9495116541888,
        },
        {
          distance: 38.0,
          pace: 326.0397140526341,
        },
        {
          distance: 39.0,
          pace: 327.1299164510794,
        },
        {
          distance: 40.0,
          pace: 328.2201188495247,
        },
        {
          distance: 41.0,
          pace: 329.3103212479699,
        },
        {
          distance: 42.0,
          pace: 330.4005236464152,
        },
      ],
    },
    {
      input_distance: 21.0975,
      input_time: 5163.1578947368425,
      predictions: [
        {
          distance: 4.0,
          pace: 356.4143455168233,
        },
        {
          distance: 5.0,
          pace: 361.41432181677123,
        },
        {
          distance: 6.0,
          pace: 364.74765515010455,
        },
        {
          distance: 7.0,
          pace: 368.0809884834379,
        },
        {
          distance: 8.0,
          pace: 371.624563731935,
        },
        {
          distance: 9.0,
          pace: 374.06479308738477,
        },
        {
          distance: 10.0,
          pace: 376.6245400318828,
        },
        {
          distance: 11.0,
          pace: 378.6245400318828,
        },
        {
          distance: 12.0,
          pace: 380.6245163318307,
        },
        {
          distance: 13.0,
          pace: 382.5014723137655,
        },
        {
          distance: 14.0,
          pace: 384.16813898043216,
        },
        {
          distance: 15.0,
          pace: 385.83480564709885,
        },
        {
          distance: 16.0,
          pace: 387.53904731109355,
        },
        {
          distance: 17.0,
          pace: 388.8927246362706,
        },
        {
          distance: 18.0,
          pace: 390.1210084297468,
        },
        {
          distance: 19.0,
          pace: 391.3201450513792,
        },
        {
          distance: 20.0,
          pace: 392.5192816730116,
        },
        {
          distance: 21.0,
          pace: 393.71841829464404,
        },
        {
          distance: 22.0,
          pace: 395.5461864121365,
        },
        {
          distance: 23.0,
          pace: 397.4421905833456,
        },
        {
          distance: 24.0,
          pace: 399.3381947545548,
        },
        {
          distance: 25.0,
          pace: 401.234198925764,
        },
        {
          distance: 26.0,
          pace: 403.13020309697316,
        },
        {
          distance: 27.0,
          pace: 405.0262072681823,
        },
        {
          distance: 28.0,
          pace: 406.9222114393915,
        },
        {
          distance: 29.0,
          pace: 408.81821561060065,
        },
        {
          distance: 30.0,
          pace: 410.71421978180985,
        },
        {
          distance: 31.0,
          pace: 412.61022395301904,
        },
        {
          distance: 32.0,
          pace: 414.5062281242282,
        },
        {
          distance: 33.0,
          pace: 416.4022322954374,
        },
        {
          distance: 34.0,
          pace: 418.2982364666466,
        },
        {
          distance: 35.0,
          pace: 420.1942406378557,
        },
        {
          distance: 36.0,
          pace: 422.09024480906487,
        },
        {
          distance: 37.0,
          pace: 423.9862489802741,
        },
        {
          distance: 38.0,
          pace: 425.9628719972658,
        },
        {
          distance: 39.0,
          pace: 428.19067689843655,
        },
        {
          distance: 40.0,
          pace: 430.4184817996073,
        },
        {
          distance: 41.0,
          pace: 432.64628670077815,
        },
        {
          distance: 42.0,
          pace: 434.8740916019489,
        },
      ],
    },
    {
      input_distance: 21.0975,
      input_time: 6258.947368421053,
      predictions: [
        {
          distance: 4.0,
          pace: 432.1196323747703,
        },
        {
          distance: 5.0,
          pace: 438.1195849746659,
        },
        {
          distance: 6.0,
          pace: 442.11958497466594,
        },
        {
          distance: 7.0,
          pace: 446.119584974666,
        },
        {
          distance: 8.0,
          pace: 450.1194664744052,
        },
        {
          distance: 9.0,
          pace: 453.91070999526465,
        },
        {
          distance: 10.0,
          pace: 456.9824347687249,
        },
        {
          distance: 11.0,
          pace: 459.4824347687249,
        },
        {
          distance: 12.0,
          pace: 461.8454267630968,
        },
        {
          distance: 13.0,
          pace: 463.8453793629925,
        },
        {
          distance: 14.0,
          pace: 465.8453793629925,
        },
        {
          distance: 15.0,
          pace: 467.8453793629925,
        },
        {
          distance: 16.0,
          pace: 469.67451242167454,
        },
        {
          distance: 17.0,
          pace: 471.2948720111696,
        },
        {
          distance: 18.0,
          pace: 472.89372084001286,
        },
        {
          distance: 19.0,
          pace: 474.4925696688561,
        },
        {
          distance: 20.0,
          pace: 476.09141849769935,
        },
        {
          distance: 21.0,
          pace: 477.69017252633404,
        },
        {
          distance: 22.0,
          pace: 480.4990031009648,
        },
        {
          distance: 23.0,
          pace: 483.43780956633907,
        },
        {
          distance: 24.0,
          pace: 486.3810185035039,
        },
        {
          distance: 25.0,
          pace: 489.7464259074002,
        },
        {
          distance: 26.0,
          pace: 493.11183331129644,
        },
        {
          distance: 27.0,
          pace: 496.4772407151928,
        },
        {
          distance: 28.0,
          pace: 499.84264811908906,
        },
        {
          distance: 29.0,
          pace: 503.2080555229853,
        },
        {
          distance: 30.0,
          pace: 506.5734629268816,
        },
        {
          distance: 31.0,
          pace: 509.93887033077795,
        },
        {
          distance: 32.0,
          pace: 513.3042777346742,
        },
        {
          distance: 33.0,
          pace: 516.6696851385705,
        },
        {
          distance: 34.0,
          pace: 520.0350925424668,
        },
        {
          distance: 35.0,
          pace: 523.400499946363,
        },
        {
          distance: 36.0,
          pace: 526.7659073502593,
        },
        {
          distance: 37.0,
          pace: 530.1313147541557,
        },
        {
          distance: 38.0,
          pace: 533.496722158052,
        },
        {
          distance: 39.0,
          pace: 536.8621295619482,
        },
        {
          distance: 40.0,
          pace: 540.2275369658445,
        },
        {
          distance: 41.0,
          pace: 543.5929443697408,
        },
        {
          distance: 42.0,
          pace: 546.9583517736371,
        },
      ],
    },
    {
      input_distance: 21.0975,
      input_time: 7354.736842105263,
      predictions: [
        {
          distance: 4.0,
          pace: 507.8249192327171,
        },
        {
          distance: 5.0,
          pace: 514.8248481325606,
        },
        {
          distance: 6.0,
          pace: 519.4915147992274,
        },
        {
          distance: 7.0,
          pace: 524.158181465894,
        },
        {
          distance: 8.0,
          pace: 529.0825532689856,
        },
        {
          distance: 9.0,
          pace: 532.7566743032489,
        },
        {
          distance: 10.0,
          pace: 536.3403532056192,
        },
        {
          distance: 11.0,
          pace: 539.3403532056192,
        },
        {
          distance: 12.0,
          pace: 542.3402821054627,
        },
        {
          distance: 13.0,
          pace: 544.9314153754297,
        },
        {
          distance: 14.0,
          pace: 547.264748708763,
        },
        {
          distance: 15.0,
          pace: 549.5980820420963,
        },
        {
          distance: 16.0,
          pace: 551.4272388008305,
        },
        {
          distance: 17.0,
          pace: 553.2287642338022,
        },
        {
          distance: 18.0,
          pace: 555.0274691662509,
        },
        {
          distance: 19.0,
          pace: 556.8261740986994,
        },
        {
          distance: 20.0,
          pace: 558.6633894220222,
        },
        {
          distance: 21.0,
          pace: 560.6619504580761,
        },
        {
          distance: 22.0,
          pace: 566.1204930608742,
        },
        {
          distance: 23.0,
          pace: 571.9507058873425,
        },
        {
          distance: 24.0,
          pace: 577.7809187138107,
        },
        {
          distance: 25.0,
          pace: 583.6111315402788,
        },
        {
          distance: 26.0,
          pace: 589.4413443667471,
        },
        {
          distance: 27.0,
          pace: 594.7890580601384,
        },
        {
          distance: 28.0,
          pace: 599.5764685924415,
        },
        {
          distance: 29.0,
          pace: 604.3638791247447,
        },
        {
          distance: 30.0,
          pace: 609.1512896570478,
        },
        {
          distance: 31.0,
          pace: 613.938700189351,
        },
        {
          distance: 32.0,
          pace: 618.7261107216542,
        },
        {
          distance: 33.0,
          pace: 623.5135212539574,
        },
        {
          distance: 34.0,
          pace: 628.3009317862604,
        },
        {
          distance: 35.0,
          pace: 633.0883423185636,
        },
        {
          distance: 36.0,
          pace: 637.8757528508668,
        },
        {
          distance: 37.0,
          pace: 642.6631633831701,
        },
        {
          distance: 38.0,
          pace: 647.4505739154732,
        },
        {
          distance: 39.0,
          pace: 652.2379844477764,
        },
        {
          distance: 40.0,
          pace: 657.0253949800796,
        },
        {
          distance: 41.0,
          pace: 661.8128055123826,
        },
        {
          distance: 42.0,
          pace: 666.6002160446859,
        },
      ],
    },
    {
      input_distance: 21.0975,
      input_time: 8450.526315789473,
      predictions: [
        {
          distance: 4.0,
          pace: 583.444976462106,
        },
        {
          distance: 5.0,
          pace: 591.5295898893082,
        },
        {
          distance: 6.0,
          pace: 597.2802537818216,
        },
        {
          distance: 7.0,
          pace: 602.9469204484881,
        },
        {
          distance: 8.0,
          pace: 608.6135871151548,
        },
        {
          distance: 9.0,
          pace: 612.5174326827273,
        },
        {
          distance: 10.0,
          pace: 616.6134923149463,
        },
        {
          distance: 11.0,
          pace: 619.78127346617,
        },
        {
          distance: 12.0,
          pace: 622.78127346617,
        },
        {
          distance: 13.0,
          pace: 625.7811786659615,
        },
        {
          distance: 14.0,
          pace: 628.7811786659615,
        },
        {
          distance: 15.0,
          pace: 631.7811786659615,
        },
        {
          distance: 16.0,
          pace: 633.6108568258428,
        },
        {
          distance: 17.0,
          pace: 635.7747850459237,
        },
        {
          distance: 18.0,
          pace: 637.9732021855833,
        },
        {
          distance: 19.0,
          pace: 640.1716193252427,
        },
        {
          distance: 20.0,
          pace: 642.3700364649021,
        },
        {
          distance: 21.0,
          pace: 644.6333017888797,
        },
        {
          distance: 22.0,
          pace: 652.3984033649084,
        },
        {
          distance: 23.0,
          pace: 660.5736180998545,
        },
        {
          distance: 24.0,
          pace: 667.5888335333284,
        },
        {
          distance: 25.0,
          pace: 674.6040489668023,
        },
        {
          distance: 26.0,
          pace: 681.6192644002764,
        },
        {
          distance: 27.0,
          pace: 688.6344798337504,
        },
        {
          distance: 28.0,
          pace: 695.6496952672243,
        },
        {
          distance: 29.0,
          pace: 702.6649107006982,
        },
        {
          distance: 30.0,
          pace: 709.6801261341723,
        },
        {
          distance: 31.0,
          pace: 716.6953415676461,
        },
        {
          distance: 32.0,
          pace: 723.71055700112,
        },
        {
          distance: 33.0,
          pace: 730.725772434594,
        },
        {
          distance: 34.0,
          pace: 737.740987868068,
        },
        {
          distance: 35.0,
          pace: 744.756203301542,
        },
        {
          distance: 36.0,
          pace: 751.7714187350159,
        },
        {
          distance: 37.0,
          pace: 758.78663416849,
        },
        {
          distance: 38.0,
          pace: 765.8018496019639,
        },
        {
          distance: 39.0,
          pace: 772.8170650354377,
        },
        {
          distance: 40.0,
          pace: 779.8322804689118,
        },
        {
          distance: 41.0,
          pace: 786.8474959023856,
        },
        {
          distance: 42.0,
          pace: 793.8627113358597,
        },
      ],
    },
    {
      input_distance: 21.0975,
      input_time: 9546.315789473685,
      predictions: [
        {
          distance: 4.0,
          pace: 658.6274326024571,
        },
        {
          distance: 5.0,
          pace: 668.234331646056,
        },
        {
          distance: 6.0,
          pace: 674.9009983127228,
        },
        {
          distance: 7.0,
          pace: 681.4481534333061,
        },
        {
          distance: 8.0,
          pace: 687.4481534333061,
        },
        {
          distance: 9.0,
          pace: 691.4476075170274,
        },
        {
          distance: 10.0,
          pace: 696.0542466751322,
        },
        {
          distance: 11.0,
          pace: 700.0542466751322,
        },
        {
          distance: 12.0,
          pace: 704.0549576766965,
        },
        {
          distance: 13.0,
          pace: 707.3881725097691,
        },
        {
          distance: 14.0,
          pace: 710.6618804203475,
        },
        {
          distance: 15.0,
          pace: 713.6618804203475,
        },
        {
          distance: 16.0,
          pace: 716.0126568023607,
        },
        {
          distance: 17.0,
          pace: 718.443148786499,
        },
        {
          distance: 18.0,
          pace: 720.8414220297639,
        },
        {
          distance: 19.0,
          pace: 723.2396952730287,
        },
        {
          distance: 20.0,
          pace: 725.6379685162935,
        },
        {
          distance: 21.0,
          pace: 728.0362417595584,
        },
        {
          distance: 22.0,
          pace: 735.8019121368384,
        },
        {
          distance: 23.0,
          pace: 744.1443304901586,
        },
        {
          distance: 24.0,
          pace: 752.4867488434792,
        },
        {
          distance: 25.0,
          pace: 760.8291671967995,
        },
        {
          distance: 26.0,
          pace: 769.17158555012,
        },
        {
          distance: 27.0,
          pace: 777.5140039034402,
        },
        {
          distance: 28.0,
          pace: 785.8564222567607,
        },
        {
          distance: 29.0,
          pace: 794.1988406100811,
        },
        {
          distance: 30.0,
          pace: 803.9044010581035,
        },
        {
          distance: 31.0,
          pace: 814.4746243125949,
        },
        {
          distance: 32.0,
          pace: 825.044847567086,
        },
        {
          distance: 33.0,
          pace: 835.6150708215771,
        },
        {
          distance: 34.0,
          pace: 846.1852940760682,
        },
        {
          distance: 35.0,
          pace: 856.7555173305595,
        },
        {
          distance: 36.0,
          pace: 867.3257405850507,
        },
        {
          distance: 37.0,
          pace: 877.8959638395417,
        },
        {
          distance: 38.0,
          pace: 888.4661870940329,
        },
        {
          distance: 39.0,
          pace: 899.036410348524,
        },
        {
          distance: 40.0,
          pace: 909.6066336030152,
        },
        {
          distance: 41.0,
          pace: 920.1768568575063,
        },
        {
          distance: 42.0,
          pace: 930.7470801119975,
        },
      ],
    },
  ];

  // Find the closest input combinations
  let bestDist1 = lookupTable[0].input_distance;
  let bestDist2 = bestDist1;
  let bestTime1 = lookupTable[0].input_time;
  let bestTime2 = bestTime1;

  // Find surrounding points in the grid
  for (const entry of lookupTable) {
    if (entry.input_distance <= distance && entry.input_distance > bestDist1) {
      bestDist1 = entry.input_distance;
    }
    if (entry.input_distance >= distance && entry.input_distance < bestDist2) {
      bestDist2 = entry.input_distance;
    }
    if (entry.input_time <= time && entry.input_time > bestTime1) {
      bestTime1 = entry.input_time;
    }
    if (entry.input_time >= time && entry.input_time < bestTime2) {
      bestTime2 = entry.input_time;
    }
  }

  // Get the four corner predictions
  const q11 = lookupTable.find(
    (e) => e.input_distance === bestDist1 && e.input_time === bestTime1
  );
  const q12 = lookupTable.find(
    (e) => e.input_distance === bestDist1 && e.input_time === bestTime2
  );
  const q21 = lookupTable.find(
    (e) => e.input_distance === bestDist2 && e.input_time === bestTime1
  );
  const q22 = lookupTable.find(
    (e) => e.input_distance === bestDist2 && e.input_time === bestTime2
  );

  // Interpolate for each prediction distance
  const allDistances = new Set();
  [q11, q12, q21, q22].forEach((q) => {
    if (q) q.predictions.forEach((p) => allDistances.add(p.distance));
  });

  return Array.from(allDistances)
    .sort((a, b) => a - b)
    .map((predDist) => {
      // Find pace at each corner
      const getPace = (q, d) => {
        if (!q) return null;
        const pred = q.predictions.find((p) => p.distance === predDist);
        return pred ? pred.pace : null;
      };

      const p11 = getPace(q11, predDist);
      const p12 = getPace(q12, predDist);
      const p21 = getPace(q21, predDist);
      const p22 = getPace(q22, predDist);

      if (!p11 || !p12 || !p21 || !p22) return null;

      // Bilinear interpolation
      const t = (time - bestTime1) / (bestTime2 - bestTime1);
      const u = (distance - bestDist1) / (bestDist2 - bestDist1);

      let pace =
        (1 - t) * (1 - u) * p11 +
        t * (1 - u) * p12 +
        (1 - t) * u * p21 +
        t * u * p22;

      if (isHilly) {
        pace += calculateHillAdjustment(pace);
      }

      return {
        distance: predDist,
        pace: pace,
        time: formatTime(pace * predDist),
      };
    })
    .filter((p) => p !== null);
}