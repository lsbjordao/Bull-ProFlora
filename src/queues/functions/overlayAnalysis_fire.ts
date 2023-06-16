//@ts-nocheck

const ee = require('@google/earthengine');
const privateKey = require('../../../credentials.json');
const fs = require('fs');
const EooAooCalc = require('@vicentecalfo/eoo-aoo-calc')

function calcArea(coordinates: any) {
    return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
            privateKey,
            async () => {

                ee.initialize()

                const eoo = new EooAooCalc.EOO({ coordinates })
                const eooObj = eoo.calculate()
                const eooGeoJson = eooObj.convexHullPolygon
                const featureCollectionEOO = ee.FeatureCollection(eooGeoJson.features)

                var EOOgeometry = featureCollectionEOO.geometry();

                const aoo = new EooAooCalc.AOO({ coordinates })
                const aooObj = aoo.calculate({ gridWidthInKm: 2 })
                const aooGeoJson = aooObj.occupiedGrids
                const featureCollectionAOO = ee.FeatureCollection(aooGeoJson.features);

                var AOOgeometry = featureCollectionAOO.geometry();

                var image = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas-fire-collection2-annual-burned-coverage-1');
                var bandNames = image.bandNames().getInfo();

                var EOOresult: any = [];
                for (var name of bandNames) {
                    var bandName = name;
                    var band = image.select(bandName);
                    var clippedImage = band.clip(EOOgeometry);
                    var areaImage = ee.Image.pixelArea().divide(1000000).addBands(clippedImage)
                    var areas = new Promise(function (resolve, reject) {
                        areaImage.reduceRegion({
                            reducer: ee.Reducer
                                .sum()
                                .group({
                                    groupField: 1,
                                    groupName: 'class',
                                }),
                            geometry: clippedImage.geometry(),
                            scale: 10,
                            maxPixels: 1e7,
                            bestEffort: true
                        }).evaluate(function (result: any) {
                            resolve(result);
                        });
                    });

                    EOOresult.push({
                        band: name,
                        areaKm2: areas
                    });
                }

                var AOOresult: any = [];
                for (var name of bandNames) {
                    var bandName = name;
                    var band = image.select(bandName);
                    var clippedImage = band.clip(AOOgeometry);
                    var areaImage = ee.Image.pixelArea().divide(1000000).addBands(clippedImage)
                    var areas = new Promise(function (resolve, reject) {
                        areaImage.reduceRegion({
                            reducer: ee.Reducer
                                .sum()
                                .group({
                                    groupField: 1,
                                    groupName: 'class',
                                }),
                            geometry: clippedImage.geometry(),
                            scale: 10,
                            maxPixels: 1e7,
                            bestEffort: true
                        }).evaluate(function (result: any) {
                            resolve(result);
                        });
                    });

                    AOOresult.push({
                        band: name,
                        areaKm2: areas
                    });
                }

                Promise.all([
                    Promise.all(EOOresult.map(({ band, areaKm2 }: {band: any, areaKm2: any}) => areaKm2)),
                    Promise.all(AOOresult.map(({ band, areaKm2 }: {band: any, areaKm2: any}) => areaKm2))
                ]).then(([EOOareas, AOOareas]) => {
                    EOOresult = EOOresult.map((res: any, i: any) => ({
                        band: res.band,
                        areaKm2: EOOareas[i],
                    }));
                
                    AOOresult = AOOresult.map((res: any, i: any) => ({
                        band: res.band,
                        areaKm2: AOOareas[i],
                    }));
                
                    resolve({ EOO: EOOresult, AOO: AOOresult });
                
                }).catch((err) => console.log(err));
                
                
            },
            (error: any) => {
                console.log(error.message)
            }
        )
    })
}

export { calcArea };