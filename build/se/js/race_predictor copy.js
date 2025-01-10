
    function predictRaceTime(distance, time) {
        // Find the closest matching input combination
        const lookupTable = [
  {
    "input_distance": 5.0,
    "input_time": 780.0,
    "predictions": [
      {
        "distance": 4.0,
        "pace": 248.00000000000003
      },
      {
        "distance": 5.0,
        "pace": 251.00000000000003
      },
      {
        "distance": 6.0,
        "pace": 253.33333333333337
      },
      {
        "distance": 7.0,
        "pace": 255.66666666666669
      },
      {
        "distance": 8.0,
        "pace": 258.0
      },
      {
        "distance": 9.0,
        "pace": 259.95218348435986
      },
      {
        "distance": 10.0,
        "pace": 262.0
      },
      {
        "distance": 11.0,
        "pace": 263.50000000000006
      },
      {
        "distance": 12.0,
        "pace": 265.00000000000006
      },
      {
        "distance": 13.0,
        "pace": 266.0
      },
      {
        "distance": 14.0,
        "pace": 267.0
      },
      {
        "distance": 15.0,
        "pace": 268.0
      },
      {
        "distance": 16.0,
        "pace": 268.91457837936713
      },
      {
        "distance": 17.0,
        "pace": 269.9059477176433
      },
      {
        "distance": 18.0,
        "pace": 270.90522823567034
      },
      {
        "distance": 19.0,
        "pace": 271.90450875369737
      },
      {
        "distance": 20.0,
        "pace": 272.90378927172435
      },
      {
        "distance": 21.0,
        "pace": 273.9030697897514
      },
      {
        "distance": 22.0,
        "pace": 274.55642982414565
      },
      {
        "distance": 23.0,
        "pace": 275.1726311797886
      },
      {
        "distance": 24.0,
        "pace": 275.7888325354316
      },
      {
        "distance": 25.0,
        "pace": 276.40503389107454
      },
      {
        "distance": 26.0,
        "pace": 277.02123524671754
      },
      {
        "distance": 27.0,
        "pace": 277.6374366023605
      },
      {
        "distance": 28.0,
        "pace": 278.25363795800354
      },
      {
        "distance": 29.0,
        "pace": 278.8698393136465
      },
      {
        "distance": 30.0,
        "pace": 279.4860406692895
      },
      {
        "distance": 31.0,
        "pace": 280.1022420249325
      },
      {
        "distance": 32.0,
        "pace": 280.7184433805754
      },
      {
        "distance": 33.0,
        "pace": 281.3346447362184
      },
      {
        "distance": 34.0,
        "pace": 281.9508460918614
      },
      {
        "distance": 35.0,
        "pace": 282.56704744750436
      },
      {
        "distance": 36.0,
        "pace": 283.1832488031473
      },
      {
        "distance": 37.0,
        "pace": 283.79945015879036
      },
      {
        "distance": 38.0,
        "pace": 284.4156515144333
      },
      {
        "distance": 39.0,
        "pace": 285.0318528700763
      },
      {
        "distance": 40.0,
        "pace": 285.6480542257193
      },
      {
        "distance": 41.0,
        "pace": 286.2642555813623
      },
      {
        "distance": 42.0,
        "pace": 286.88045693700525
      }
    ]
  },
  {
    "input_distance": 10.0,
    "input_time": 3093.3333333333335,
    "predictions": [
      {
        "distance": 4.0,
        "pace": 471.31111111111113
      },
      {
        "distance": 5.0,
        "pace": 477.31111111111113
      },
      {
        "distance": 6.0,
        "pace": 482.26666666666677
      },
      {
        "distance": 7.0,
        "pace": 486.60000000000014
      },
      {
        "distance": 8.0,
        "pace": 490.93333333333345
      },
      {
        "distance": 9.0,
        "pace": 494.86160855987316
      },
      {
        "distance": 10.0,
        "pace": 497.9333333333335
      },
      {
        "distance": 11.0,
        "pace": 500.74444444444447
      },
      {
        "distance": 12.0,
        "pace": 503.2444444444445
      },
      {
        "distance": 13.0,
        "pace": 505.57777777777784
      },
      {
        "distance": 14.0,
        "pace": 507.91111111111115
      },
      {
        "distance": 15.0,
        "pace": 510.24444444444447
      },
      {
        "distance": 16.0,
        "pace": 512.0736012031787
      },
      {
        "distance": 17.0,
        "pace": 513.6939607926737
      },
      {
        "distance": 18.0,
        "pace": 515.2928096215169
      },
      {
        "distance": 19.0,
        "pace": 516.8916584503602
      },
      {
        "distance": 20.0,
        "pace": 518.5823762446594
      },
      {
        "distance": 21.0,
        "pace": 520.3810811771081
      },
      {
        "distance": 22.0,
        "pace": 524.0225413829244
      },
      {
        "distance": 23.0,
        "pace": 527.861949829623
      },
      {
        "distance": 24.0,
        "pace": 531.7013582763216
      },
      {
        "distance": 25.0,
        "pace": 535.5407667230202
      },
      {
        "distance": 26.0,
        "pace": 539.3801751697188
      },
      {
        "distance": 27.0,
        "pace": 543.2195836164174
      },
      {
        "distance": 28.0,
        "pace": 547.0589920631159
      },
      {
        "distance": 29.0,
        "pace": 550.8984005098146
      },
      {
        "distance": 30.0,
        "pace": 554.737808956513
      },
      {
        "distance": 31.0,
        "pace": 558.5772174032116
      },
      {
        "distance": 32.0,
        "pace": 562.4166258499102
      },
      {
        "distance": 33.0,
        "pace": 566.2560342966088
      },
      {
        "distance": 34.0,
        "pace": 570.0954427433074
      },
      {
        "distance": 35.0,
        "pace": 573.9348511900059
      },
      {
        "distance": 36.0,
        "pace": 578.1771015362901
      },
      {
        "distance": 37.0,
        "pace": 583.1067123814339
      },
      {
        "distance": 38.0,
        "pace": 588.0363232265779
      },
      {
        "distance": 39.0,
        "pace": 592.9659340717217
      },
      {
        "distance": 40.0,
        "pace": 597.8955449168654
      },
      {
        "distance": 41.0,
        "pace": 602.8251557620094
      },
      {
        "distance": 42.0,
        "pace": 607.7547666071532
      }
    ]
  },
  {
    "input_distance": 21.0975,
    "input_time": 5406.666666666667,
    "predictions": [
      {
        "distance": 4.0,
        "pace": 373.459959551911
      },
      {
        "distance": 5.0,
        "pace": 378.4599358518589
      },
      {
        "distance": 6.0,
        "pace": 382.1266025185256
      },
      {
        "distance": 7.0,
        "pace": 385.79326918519223
      },
      {
        "distance": 8.0,
        "pace": 389.4598410516503
      },
      {
        "distance": 9.0,
        "pace": 391.92207932885304
      },
      {
        "distance": 10.0,
        "pace": 394.4818499734033
      },
      {
        "distance": 11.0,
        "pace": 396.4818262733512
      },
      {
        "distance": 12.0,
        "pace": 398.48182627335115
      },
      {
        "distance": 13.0,
        "pace": 400.48182627335115
      },
      {
        "distance": 14.0,
        "pace": 402.4818262733512
      },
      {
        "distance": 15.0,
        "pace": 404.4817788732469
      },
      {
        "distance": 16.0,
        "pace": 405.396357252614
      },
      {
        "distance": 17.0,
        "pace": 406.7721382997526
      },
      {
        "distance": 18.0,
        "pace": 408.1711310249904
      },
      {
        "distance": 19.0,
        "pace": 409.5701237502282
      },
      {
        "distance": 20.0,
        "pace": 410.969116475466
      },
      {
        "distance": 21.0,
        "pace": 412.3681092007039
      },
      {
        "distance": 22.0,
        "pace": 414.66887077151574
      },
      {
        "distance": 23.0,
        "pace": 416.8966756726865
      },
      {
        "distance": 24.0,
        "pace": 419.1244805738573
      },
      {
        "distance": 25.0,
        "pace": 421.3522854750281
      },
      {
        "distance": 26.0,
        "pace": 423.5800903761989
      },
      {
        "distance": 27.0,
        "pace": 425.8078952773696
      },
      {
        "distance": 28.0,
        "pace": 428.0357001785404
      },
      {
        "distance": 29.0,
        "pace": 430.26350507971125
      },
      {
        "distance": 30.0,
        "pace": 432.491309980882
      },
      {
        "distance": 31.0,
        "pace": 434.7191148820528
      },
      {
        "distance": 32.0,
        "pace": 436.94691978322356
      },
      {
        "distance": 33.0,
        "pace": 439.17472468439433
      },
      {
        "distance": 34.0,
        "pace": 441.4025295855651
      },
      {
        "distance": 35.0,
        "pace": 443.6303344867359
      },
      {
        "distance": 36.0,
        "pace": 445.85813938790665
      },
      {
        "distance": 37.0,
        "pace": 448.08594428907753
      },
      {
        "distance": 38.0,
        "pace": 450.31374919024825
      },
      {
        "distance": 39.0,
        "pace": 452.5415540914191
      },
      {
        "distance": 40.0,
        "pace": 454.76935899258984
      },
      {
        "distance": 41.0,
        "pace": 456.9971638937606
      },
      {
        "distance": 42.0,
        "pace": 459.2249687949314
      }
    ]
  },
  {
    "input_distance": 21.0975,
    "input_time": 7720.0,
    "predictions": [
      {
        "distance": 4.0,
        "pace": 533.3933402853487
      },
      {
        "distance": 5.0,
        "pace": 540.3932691851923
      },
      {
        "distance": 6.0,
        "pace": 545.2599358518589
      },
      {
        "distance": 7.0,
        "pace": 550.2599358518589
      },
      {
        "distance": 8.0,
        "pace": 555.2597462514418
      },
      {
        "distance": 9.0,
        "pace": 559.5426392155296
      },
      {
        "distance": 10.0,
        "pace": 563.1263181178999
      },
      {
        "distance": 11.0,
        "pace": 566.1262470177435
      },
      {
        "distance": 12.0,
        "pace": 569.1262470177434
      },
      {
        "distance": 13.0,
        "pace": 571.7929136844101
      },
      {
        "distance": 14.0,
        "pace": 574.4595803510767
      },
      {
        "distance": 15.0,
        "pace": 576.9928188842016
      },
      {
        "distance": 16.0,
        "pace": 578.8219756429359
      },
      {
        "distance": 17.0,
        "pace": 580.6712150857899
      },
      {
        "distance": 18.0,
        "pace": 582.6697761218438
      },
      {
        "distance": 19.0,
        "pace": 584.668337157898
      },
      {
        "distance": 20.0,
        "pace": 586.666898193952
      },
      {
        "distance": 21.0,
        "pace": 588.665459230006
      },
      {
        "distance": 22.0,
        "pace": 594.124001832804
      },
      {
        "distance": 23.0,
        "pace": 599.9542146592723
      },
      {
        "distance": 24.0,
        "pace": 605.7844274857405
      },
      {
        "distance": 25.0,
        "pace": 611.6146403122086
      },
      {
        "distance": 26.0,
        "pace": 617.444853138677
      },
      {
        "distance": 27.0,
        "pace": 623.2750659651451
      },
      {
        "distance": 28.0,
        "pace": 629.1052787916135
      },
      {
        "distance": 29.0,
        "pace": 634.9354916180816
      },
      {
        "distance": 30.0,
        "pace": 640.7657044445497
      },
      {
        "distance": 31.0,
        "pace": 646.5959172710179
      },
      {
        "distance": 32.0,
        "pace": 652.4261300974863
      },
      {
        "distance": 33.0,
        "pace": 658.2563429239544
      },
      {
        "distance": 34.0,
        "pace": 664.0865557504226
      },
      {
        "distance": 35.0,
        "pace": 669.916768576891
      },
      {
        "distance": 36.0,
        "pace": 675.7469814033591
      },
      {
        "distance": 37.0,
        "pace": 681.5771942298275
      },
      {
        "distance": 38.0,
        "pace": 687.4074070562956
      },
      {
        "distance": 39.0,
        "pace": 693.2376198827637
      },
      {
        "distance": 40.0,
        "pace": 698.4218862081495
      },
      {
        "distance": 41.0,
        "pace": 703.2092967404528
      },
      {
        "distance": 42.0,
        "pace": 707.996707272756
      }
    ]
  },
  {
    "input_distance": 21.0975,
    "input_time": 10033.333333333334,
    "predictions": [
      {
        "distance": 4.0,
        "pace": 683.9942847049622
      },
      {
        "distance": 5.0,
        "pace": 693.8762323911578
      },
      {
        "distance": 6.0,
        "pace": 700.5428990578247
      },
      {
        "distance": 7.0,
        "pace": 707.2095657244912
      },
      {
        "distance": 8.0,
        "pace": 713.8482776312858
      },
      {
        "distance": 9.0,
        "pace": 718.2406904710951
      },
      {
        "distance": 10.0,
        "pace": 723.0564274990222
      },
      {
        "distance": 11.0,
        "pace": 726.938375185218
      },
      {
        "distance": 12.0,
        "pace": 730.938375185218
      },
      {
        "distance": 13.0,
        "pace": 734.2717085185511
      },
      {
        "distance": 14.0,
        "pace": 737.6050418518845
      },
      {
        "distance": 15.0,
        "pace": 740.938375185218
      },
      {
        "distance": 16.0,
        "pace": 743.7722078772516
      },
      {
        "distance": 17.0,
        "pace": 746.2027472614941
      },
      {
        "distance": 18.0,
        "pace": 748.6010205047589
      },
      {
        "distance": 19.0,
        "pace": 750.9992937480238
      },
      {
        "distance": 20.0,
        "pace": 753.3975669912886
      },
      {
        "distance": 21.0,
        "pace": 755.7958402345533
      },
      {
        "distance": 22.0,
        "pace": 757.4837507407617
      },
      {
        "distance": 23.0,
        "pace": 759.1151698992558
      },
      {
        "distance": 24.0,
        "pace": 769.6853931537469
      },
      {
        "distance": 25.0,
        "pace": 780.2556164082381
      },
      {
        "distance": 26.0,
        "pace": 790.8258396627293
      },
      {
        "distance": 27.0,
        "pace": 801.3960629172204
      },
      {
        "distance": 28.0,
        "pace": 811.9662861717115
      },
      {
        "distance": 29.0,
        "pace": 822.5365094262028
      },
      {
        "distance": 30.0,
        "pace": 833.106732680694
      },
      {
        "distance": 31.0,
        "pace": 843.6769559351851
      },
      {
        "distance": 32.0,
        "pace": 854.2471791896762
      },
      {
        "distance": 33.0,
        "pace": 864.8174024441673
      },
      {
        "distance": 34.0,
        "pace": 875.3876256986584
      },
      {
        "distance": 35.0,
        "pace": 885.9578489531497
      },
      {
        "distance": 36.0,
        "pace": 896.5280722076408
      },
      {
        "distance": 37.0,
        "pace": 907.0982954621319
      },
      {
        "distance": 38.0,
        "pace": 917.6685187166232
      },
      {
        "distance": 39.0,
        "pace": 928.2387419711145
      },
      {
        "distance": 40.0,
        "pace": 938.6262309204295
      },
      {
        "distance": 41.0,
        "pace": 948.5802528192777
      },
      {
        "distance": 42.0,
        "pace": 958.534274718126
      }
    ]
  }
];
        let bestMatch = lookupTable[0];
        let minDiff = Infinity;
        
        for (const entry of lookupTable) {
            const timeDiff = Math.abs(entry.input_time - time);
            const distDiff = Math.abs(entry.input_distance - distance);
            const totalDiff = timeDiff/time + distDiff/distance;  // Normalized difference
            
            if (totalDiff < minDiff) {
                minDiff = totalDiff;
                bestMatch = entry;
            }
        }
        
        // Return the predictions for this input combination
        return bestMatch.predictions.map(pred => ({
            distance: pred.distance,
            pace: pred.pace,
            time: formatTime(pred.pace * pred.distance)
        }));
    }
    
    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    