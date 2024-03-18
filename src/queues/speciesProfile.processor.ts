import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import * as fs from 'fs';
import * as ejs from 'ejs';

export const QUEUE_NAME_speciesProfile = 'Species profile';
export const InjectQueue_speciesProfile = (): ParameterDecorator =>
  InjectQueue(QUEUE_NAME_speciesProfile);

@Processor(QUEUE_NAME_speciesProfile, {
  concurrency: 1,
})
export class Processor_speciesProfile extends WorkerHost {
  private readonly logger = new Logger(Processor_speciesProfile.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const species = job.data.species;

    if (!species) {
      return Promise.reject(new Error('Failed'));
    }

    job.updateProgress(1);

    function readJson(filePath: string) {
      return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, file) => {
          if (err) {
            console.error(err);
            reject(err);
            return;
          }

          try {
            const json = JSON.parse(file);
            resolve(json);
          } catch (error) {
            console.error(error);
            reject(error);
          }
        });
      });
    }

    const dirs = [
      'distribution',
      'information',
      'obrasPrinceps',
      'citationFFB',
      'oac/MapBiomas-LandCover7',
      'oac/MapBiomas-Fire',
      'oac/PANs',
      'oac/TERs',
      'oac/UCs',
      'conservationActions',
      'threats',
    ];

    const data: any = {};
    const promises = dirs.map((dir) => {
      const filePath = `G:/Outros computadores/Meu computador/CNCFlora_data/${dir}/${species}.json`;
      return readJson(filePath).then((result) => {
        // console.log(result)
        data[dir] = result;
      });
    });

    Promise.all(promises)
      .then(async () => {
        const output: any = {};
        dirs.forEach((dir) => {
          output[dir] = data[dir];
        });

        output.species = species;

        output.obrasPrinceps.output = '';

        if (output.obrasPrinceps.Tropicos) {
          output.obrasPrinceps.output += `${output.obrasPrinceps.Tropicos[0].DisplayReference}, ${output.obrasPrinceps.Tropicos[0].DisplayDate}. [Tropicos]<br>`;
        }

        if (output.obrasPrinceps.Ipni) {
          output.obrasPrinceps.output += `${output.obrasPrinceps.Ipni[0].publication} ${output.obrasPrinceps.Ipni[0].referenceCollation}, ${output.obrasPrinceps.Ipni[0].publicationYear}. [IPNI]`;
        }

        if (!output.obrasPrinceps.Tropicos && !output.obrasPrinceps.Ipni) {
          output.obrasPrinceps.output = 'Espécie não encontrada.';
        }

        output['MapBiomas'] = output['oac/MapBiomas-LandCover7'];
        delete output['oac/MapBiomas-LandCover7'];

        output.EOO = output.MapBiomas.EOO_km2;
        output.EOO = output.EOO.toFixed(0);
        output.EOO = output.EOO.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        output.AOO = output.MapBiomas.AOO_km2;
        output.AOOutil = output.MapBiomas.AOOutil_km2;

        output.information.endemism = output.information.endemism.replace(
          'NO',
          'Não',
        );
        output.information.endemism = output.information.endemism.replace(
          'YES',
          'Sim',
        );

        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Floresta de Terra Firme',
            '<b>Floresta de Terra Firme</b> [IUCN Habitat: 1.6]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Floresta de Igapó',
            '<b>Floresta de Igapó</b> [IUCN Habitat: 1.8]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Manguezal',
            '<b>Manguezal</b> [IUCN Habitat: 1.7]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Floresta de Várzea',
            '<b>Floresta de Várzea</b> [IUCN Habitat: 1.8]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Campo de Várzea',
            '<b>Campo de Várzea</b> [IUCN Habitat: 4.6]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Savana Amazônica',
            '<b>Savana Amazônica</b> [IUCN Habitat: 2.1]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Floresta Estacional Semidecidual',
            '<b>Floresta Estacional Semidecidual</b> [IUCN Habitat: 1.5]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Vegetação Sobre Afloramentos Rochosos',
            '<b>Vegetação Sobre Afloramentos Rochosos</b> [IUCN Habitat: 6]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Campinarana',
            '<b>Campinarana</b> [IUCN Habitat: 1.6(arbórea)/3.6(arbustiva)/4.6(herbácea)]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Cerrado (lato sensu)',
            '<b>Cerrado (lato sensu)</b> [IUCN Habitat: 1.5(predominantemente arbóreo)/2.1(savana seca)/2.2(savana úmida)/3.5(predominantemente arbustivo)]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Restinga',
            '<b>Restinga</b> [IUCN Habitat: 1.5(predominantemente arbórea)/3.5(predominantemente arbustiva)/13.3(dunas)]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Floresta Ciliar ou Galeria',
            '<b>Floresta Ciliar ou Galeria</b> [IUCN Habitat: 1.6(até 1200 m alt.)/1.9(acima de 1200 m alt.)]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Campo de Altitude',
            '<b>Campo de Altitude</b> [3.7(arbustivo)/4.7(herbáceo)]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Caatinga (stricto sensu)',
            '<b>Caatinga (stricto sensu)</b> [IUCN Habitat: 2.1]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Área Antrópica',
            '<b>Área Antrópica</b> [IUCN Habitat: 14.1(áreas aráveis)/14.2(pastagens)/14.3(plantações em larga escala, monoculturas)/14.4(agricultura familiar, ou em pequena escala)/14.5(urbana, comercial, industrial)/14.6(vegetação secundária ou degradada)]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Floresta Estacional Decidual',
            '<b>Floresta Estacional Decidual</b> [IUCN Habitat: 1.5]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Campo rupestre',
            '<b>Campo rupestre</b> [IUCN Habitat: 3.7(arbustivo)/4.7(herbáceo)]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Palmeiral',
            '<b>Palmeiral</b> [IUCN Habitat: 1.5(seco)/1.6(úmido e abaixo de 1200 m alt.)/1.9(úmido e acima de 1200 m alt.)]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Carrasco',
            '<b>Carrasco</b> [IUCN Habitat: 3.5]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Floresta Estacional Perenifólia',
            '<b>Floresta Estacional Perenifólia</b> [IUCN Habitat: 1.5]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Floresta Ombrófila Mista',
            '<b>Floresta Ombrófila Mista</b> [IUCN Habitat: 1.6(até 1200 m alt.)/1.9(acima de 1200 m alt.)]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Floresta Ombrófila (= Floresta Pluvial)',
            '<b>Floresta Ombrófila (= Floresta Pluvial)</b> [IUCN Habitat: 1.6(até 1200 m alt.)/1.9(acima de 1200 m alt.)]',
          );
        output.information.vegetationType =
          output.information.vegetationType.replace(
            'Vegetação Aquática',
            '<b>Vegetação Aquática</b> [IUCN Habitat: 5.1/5.2/5.3/5.4/5.5/5.6]',
          );

        output.information.IUCN_assessment_presence =
          output.information.IUCN_assessment_presence.replace('NO', 'Não');
        output.information.IUCN_assessment_presence =
          output.information.IUCN_assessment_presence.replace('YES', 'Sim');

        // Actions
        output['PANs'] = output['oac/PANs'];
        delete output['oac/PANs'];
        output['TERs'] = output['oac/TERs'];
        delete output['oac/TERs'];
        output['UCs'] = output['oac/UCs'];
        delete output['oac/UCs'];

        // Include UCs
        let includeUC = {};
        if (output.UCs.length === 0) {
          includeUC = {
            action: '1.1 Site/area protection',
            situation: 'needed',
            text: 'A espécie não é conhecida em nenhuma unidade de conservação, mas claramente existe a necessidade de melhorar a proteção do habitat nos locais onde se sabe que ela ocorre. São necessárias pesquisas adicionais para determinar se esta espécie está ou não experimentando um declínio efetivo ou está passando por flutuações naturais da população.',
            reference: '',
          };
        } else {
          if (output.UCs.length === 1) {
            includeUC = {
              action: '1.1 Site/area protection',
              situation: 'on going',
              text:
                'A espécie foi registrada na seguinte Unidade de Conservação: ' +
                output.UCs.join(', ') +
                '.',
              reference: '',
            };
          } else {
            includeUC = {
              action: '1.1 Site/area protection',
              situation: 'on going',
              text:
                'A espécie foi registrada nas seguintes Unidades de Conservação: ' +
                output.UCs.join(', ') +
                '.',
              reference: '',
            };
          }
        }

        output.UCs.includeUC = includeUC;

        // Include PANs
        output.PANs.includePAN = [];
        if (output.PANs.length > 0) {
          let regexRJ = /Rio de Janeiro/i;
          output.PANs.forEach((value: any) => {
            if (regexRJ.test(value)) {
              if (
                output.distribution.bestMatch.every((obj: any) => {
                  obj.firstLvl === 'Rio de Janeiro';
                })
              ) {
                output.PANs.includePAN.push({
                  action: '5.1.2 National level',
                  situation: 'on going',
                  text: 'A espécie está contemplada pelo Plano de Ação Nacional para a conservação da flora endêmica ameaçada de extinção do estado do Rio de Janeiro (Pougy et al., 2018).',
                  reference:
                    'Pougy, N., Martins, E., Verdi, M., Fernandez, E., Loyola, R., Silveira-Filho, T.B., Martinelli, G. (Orgs.), 2018. Plano de Ação Nacional para a conservação da flora endêmica ameaçada de extinção do estado do Rio de Janeiro. Secretaria de Estado do Ambiente-SEA: Andrea Jakobsson Estúdio, Rio de Janeiro. 80 p.',
                });
              } else {
                output.PANs.includePAN.push({
                  action: '5.1.2 National level',
                  situation: 'on going',
                  text: 'A espécie ocorre no território de abrangência do Plano de Ação Nacional para a conservação da flora endêmica ameaçada de extinção do estado do Rio de Janeiro (Pougy et al., 2018).',
                  reference:
                    'Pougy, N., Martins, E., Verdi, M., Fernandez, E., Loyola, R., Silveira-Filho, T.B., Martinelli, G. (Orgs.), 2018. Plano de Ação Nacional para a conservação da flora endêmica ameaçada de extinção do estado do Rio de Janeiro. Secretaria de Estado do Ambiente-SEA: Andrea Jakobsson Estúdio, Rio de Janeiro. 80 p.',
                });
              }
            }
          });

          let regexLagoasDoSul = /Lagoas do Sul/i;
          output.PANs.forEach((value: any) => {
            if (regexLagoasDoSul.test(value)) {
              output.PANs.includePAN.push({
                action: '5.1.2 National level',
                situation: 'on going',
                text: 'A espécie ocorre no território de abrangência do Plano de Ação Nacional Lagoas do Sul para a conservação da flora melhorar o estado de conservação das espécies ameaçadas e dos ecossistemas das lagoas da planície costeira do sul do Brasil (ICMBio, 2018).',
                reference:
                  'ICMBio - Instituto Chico Mendes de Conservação da Biodiversidade, 2018. Portaria nº 751, de 27 de agosto de 2018. Diário Oficial da União, 29/08/2018, Edição 167, Seção 1, p. 54. URL https://www.icmbio.gov.br/portal/images/stories/docs-pan/pan-lagoas-do-sul/1-ciclo/pan-lagoas-do-sul-portaria-aprovacao.pdf',
              });
            }
          });

          let regexEspinhaco = /Serra do Espinhaço/i;
          output.PANs.forEach((value: any) => {
            if (regexEspinhaco.test(value)) {
              output.PANs.includePAN.push({
                action: '5.1.2 National level',
                situation: 'on going',
                text: 'A espécie ocorre no território de abrangência do Plano de Ação Nacional para a conservação da flora Ameaçada de extinção da Serra do Espinhaço Meridional (Pougy et al., 2015).',
                reference:
                  'Pougy, N., Verdi, M., Martins, E., Loyola, R., Martinelli, G. (Orgs.), 2015. Plano de Ação Nacional para a conservação da flora Ameaçada de extinção da Serra do Espinhaço Meridional. CNCFlora: Jardim Botânico do Rio de Janeiro: Laboratório de Biogeografia da Conservação: Andrea Jakobsson Estúdio, Rio de Janeiro. 100 p.',
              });
            }
          });

          let regexGraoMogol = /Grão Mogol/i;
          output.PANs.forEach((value: any) => {
            if (regexGraoMogol.test(value)) {
              output.PANs.includePAN.push({
                action: '5.1.2 National level',
                situation: 'on going',
                text: 'A espécie ocorre no território de abrangência do Plano de Ação Nacional para a Conservação da Flora Ameaçada de Extinção da Região de Grão Mogol-Francisco Sá (Pougy et al., 2015).',
                reference:
                  'Pougy, N., Martins, E., Verdi, M., Maurenza, D., Loyola, R., Martinelli, G. (Orgs.), 2015. Plano de Ação Nacional para a Conservação da Flora Ameaçada de Extinção da Região de Grão Mogol-Francisco Sá. CNCFlora: Jardim Botânico do Rio de Janeiro: Laboratório de Biogeografia da Conservação: Andrea Jakobsson Estúdio, Rio de Janeiro. 76 p.',
              });
            }
          });
        }

        // Include TERs
        output.TERs.includeTER = {};
        if (output.TERs.length > 0) {
          let TERs = '';
          output.TERs = output.TERs.map((TER: any) => {
            return (
              'Território ' +
              TER.match(/PAT\s.*/)[0].replace('PATsPATs', 'PAT') +
              TER.match(/TER.*\s-\s/)[0]
                .replace('TER', ' - ')
                .replace(/(- [0-9]+).*/, '$1')
            );
          });
          TERs = output.TERs.join(', ');
          output.TERs.includeTER = {
            action: '5.1.2 National level',
            situation: 'needed',
            text: `A espécie ocorre em território que será contemplado por Plano de Ação Nacional Territorial (PAT), no âmbito do projeto GEF Pró-Espécies - Todos Contra a Extinção: ${TERs}.`,
            reference: '',
          };
        }

        // Include threatened lists
        output.conservationActions.includeThreatenedList = [];
        for (const list of output.conservationActions.threatenedLists) {
          if (list.File === 'dec IEMA 1499R.json') {
            output.conservationActions.includeThreatenedList.push({
              action: '5.1.3 Sub-national level',
              situation: 'on going',
              text: `A espécie foi avaliada como ${list.Status} na lista oficial das espécies ameaçadas de extinção no Estado do Espírito Santo (Espírito Santo, 2005).`,
              reference:
                'Espírito Santo, 2005. Lista de Espécies Ameaçadas de Extinção no Espírito Santo. Decreto nº 1.499-R. Diário Oficial do Estado do Espírito Santo, 14/06/2005.',
            });
          }

          if (list.File === 'res COEMA 54.json') {
            output.conservationActions.includeThreatenedList.push({
              action: '5.1.3 Sub-national level',
              situation: 'on going',
              text: `A espécie foi avaliada como ${list.Status} na lista oficial das espécies ameaçadas de extinção no Estado do Pará (Pará, 2007).`,
              reference:
                'COEMA - Conselho Estadual de Meio Ambiente, 2007. Lista de Espécies Ameaçadas de Extinção no Pará. Resolução nº 54, de 24 de outubro de 2007.',
            });
          }

          if (list.File === 'dec RS 52109.json') {
            output.conservationActions.includeThreatenedList.push({
              action: '5.1.3 Sub-national level',
              situation: 'on going',
              text: `A espécie foi avaliada como ${list.Status} na lista oficial das espécies da flora ameaçadas de extinção no Estado do Rio Grande do Sul (Rio Grande do Sul, 2014).`,
              reference:
                'Rio Grande do Sul, 2014. Lista de espécies da flora nativa ameaçadas de extinção no Estado do Rio Grande do Sul. Decreto nº 52.109, 01/12/2014, Diário Oficial do Estado do Rio Grande do Sul, 02/12/2014, nº 233, pp. 2-12. URL http://www.al.rs.gov.br/filerepository/repLegis/arquivos/DEC%2052.109.pdf.',
            });
          }

          if (list.File === 'res CONSEMA 51.json') {
            output.conservationActions.includeThreatenedList.push({
              action: '5.1.3 Sub-national level',
              situation: 'on going',
              text: `A espécie foi avaliada como ${list.Status} na lista oficial das espécies da flora ameaçadas de extinção no Estado de Santa Catarina (CONSEMA, 2014).`,
              reference:
                'CONSEMA - Conselho Estadual do Meio Ambiente. 2014. Resolução nº 51/2014. Lista oficial das espécies da flora Ameaçada de extinção no Estado de Santa Catarina.',
            });
          }

          if (list.File === 'res SMA 57.json') {
            output.conservationActions.includeThreatenedList.push({
              action: '5.1.3 Sub-national level',
              situation: 'on going',
              text: `A espécie foi avaliada como ${list.Status} na lista oficial das espécies da flora ameaçadas de extinção no Estado de São Paulo (SMA, 2016).`,
              reference:
                'SMA - Secretaria do Meio Ambiente do Estado de São Paulo, 2016. Resolução nº 57, de 05 de junho de 2016. Lista de espécies da flora ameaçadas de extinção no Estado de São Paulo. Diário Oficial do Estado de São Paulo, 07/06/2016, Seção I, pp. 69-71. URL https://cetesb.sp.gov.br/licenciamentoambiental/wp-content/uploads/sites/32/2019/05/Resolução-SMA-nz-57-2016.pdf.',
            });
          }

          if (list.File === 'port SEMA 40.json') {
            output.conservationActions.includeThreatenedList.push({
              action: '5.1.3 Sub-national level',
              situation: 'on going',
              text: `A espécie foi avaliada como ${list.Status} na lista oficial das espécies da flora ameaçadas de extinção no Estado da Bahia (SEMA, 2017).`,
              reference:
                'SEMA - Secretaria do Meio Ambiente do Governo do Estado da Bahia, 2017. Portaria SEMA nº 40, de 21 de agosto de 2017. Lista oficial das espécies da flora ameaçadas de extinção do Estado da Bahia. Diário Oficial do Estado da Bahia, Ano CI, nº 22.244, 22/08/2017, pp. 22-27. URL http://www.meioambiente.ba.gov.br/arquivos/File/Editais/portaria40flora.docx.',
            });
          }

          if (list.File === 'port MMA 148.json') {
            output.conservationActions.includeThreatenedList.push({
              action: '5.1.3 Sub-national level',
              situation: 'on going',
              text: `A espécie foi avaliada como ${list.Status} na lista oficial das espécies da Lista Nacional de Espécies Ameaçadas de Extinção (MMA, 2022).`,
              reference:
                'MMA - Ministério do Meio Ambiente, 2022. Portaria nº 148, de 7 de junho de 2022. Diário Oficial da União, 08/06/2022, Seção 1, p. 74. URL https://www.in.gov.br/web/dou/-/portaria-mma-n-148-de-7-de-junho-de-2022-406272733.',
            });
          }
        }

        // Municípios prioritários da Amazônia Legal
        if (output.conservationActions.municipsPriorAL.length > 0) {
          let municips = output.conservationActions.municipsPriorAL.map((item: any) => `${item.MUNICIPIO} (${item.UF})`).join(', ')
          if (output.conservationActions.municipsPriorAL.length > 1) {
            const lastComma = municips.lastIndexOf(',');

            if (lastComma !== -1) {
              municips = municips.substring(0, lastComma) + ' e' + municips.substring(lastComma + 1);
            }
          }

          let nMunicips = 'municípíos'
          if (output.conservationActions.municipsPriorAL.length === 1) {
            nMunicips = 'município'
          }

          output.conservationActions.includeThreatenedList.push({
            action: '5.1.2 National level',
            situation: 'on going',
            text: `A espécie ocorre em ${municips}, ${nMunicips} da Amazônia Legal considerado prioritário para fiscalização, referido no Decreto Federal 6.321/2007 (BRASIL, 2007) e atualizado em 2018 pela Portaria MMA nº 428/18 (MMA, 2018).`,
            reference:
              `BRASIL, 2007. Decreto Federal nº 6.321, de 21 de dezembro de 2007. Diário Oficial da União, 21/12/2007, Edição Extra, Seção 1, p. 12. URL http://www.planalto.gov.br/ccivil_03/_Ato2007-2010/2007/Decreto/D6321.htm (acesso em 15 de março de 2022).<br><br>
              MMA - Ministério do Meio Ambiente, 2018. Portaria MMA nº 428, de 19 de novembro de 2018. Diário Oficial da União, 20/11/2018, Edição 222, Seção 1, p. 74. URL http://www.in.gov.br/materia/-/asset_publisher/Kujrw0TZC2Mb/content/id/50863140/do1-2018-11-20-portaria-n-428-de-19-de-novembro-de-2018-50863024 (acesso em 15 de março de 2022).`,
          })
        }

        // Threats

        let today = new Date();
        const months = [
          'janeiro',
          'fevereiro',
          'março',
          'abril',
          'maio',
          'junho',
          'julho',
          'agosto',
          'setembro',
          'outubro',
          'novembro',
          'dezembro',
        ];
        const day = today.getDate();
        const month = months[today.getMonth()];
        const year = today.getFullYear();

        const date = `${day} de ${month} de ${year}`;

        const threatsIUCN: any = {
          silvicultura: '2.2.3 Scale Unknown/Unrecorded',
          agropecuária: '2.3.4 Scale Unknown/Unrecorded',
          pastagem: '2.3.4 Scale Unknown/Unrecorded',
          agricultura: '2.1.4 Scale Unknown/Unrecorded',
          'lavoura temporária': '2.1.4 Scale Unknown/Unrecorded',
          cana: '2.1.4 Scale Unknown/Unrecorded',
          'mosaico de usos': '2.3.4 Scale Unknown/Unrecorded',
          'área urbanizada': '1.1 Housing & urban areas',
          mineração: '3.2 Mining & quarrying',
          'cultura de palma': '2.1.4 Scale Unknown/Unrecorded',
          'lavoura perene': '2.1.4 Scale Unknown/Unrecorded',
          soja: '2.1.4 Scale Unknown/Unrecorded',
          arroz: '2.1.4 Scale Unknown/Unrecorded',
          'outras lavouras temporárias': '2.1.4 Scale Unknown/Unrecorded',
          café: '2.1.4 Scale Unknown/Unrecorded',
          citrus: '2.1.4 Scale Unknown/Unrecorded',
          'outras lavouras perenes': '2.1.4 Scale Unknown/Unrecorded',
          'área urbana': '2.1.4 Scale Unknown/Unrecorded',
          infraestrutura: '2.1.4 Scale Unknown/Unrecorded',
          'outras áreas urbanizadas': '2.1.4 Scale Unknown/Unrecorded',
          'cultivos simples': '2.1.4 Scale Unknown/Unrecorded',
          'cultivos múltiples': '2.1.4 Scale Unknown/Unrecorded',
          algodão: '2.1.4 Scale Unknown/Unrecorded',
        };

        const AooThreats = output.threats.AOO;
        const EooThreats = output.threats.EOO;

        if (AooThreats.length === 0 && EooThreats.length === 0) {
          output.threats.includeThreat = [
            {
              threat:
                'Nenhuma ameaça significativa relacionada à conversão para uso alternativo do solo.',
              text: '',
              reference: '',
            },
          ];
        }

        if (AooThreats.length !== 0 && EooThreats.length !== 0) {

          let AooThreatsList = [];
          for (const threat of AooThreats) {
            const lastYear = threat.lastYear;
            const lastYearPercentage = threat.lastYear_percentage.toFixed(2);
            const lastYearKm2 = threat.lastYear_km2.toFixed(2);
            const annualRate = threat.trendAnalysis.annualRate.toFixed(2);
            const pValue = threat.trendAnalysis.pValue.toExponential(4);
            const rSquared = threat.trendAnalysis.rSquared.toFixed(4);
            const threatName = threat.threat;

            let AooThreatText = `Em ${lastYear}, a espécie apresentava ${lastYearPercentage.replace(
              '.',
              ',',
            )}% (${lastYearKm2.replace(
              '.',
              ',',
            )} km²) da sua AOO convertidos em áreas de ${threatName}, atividade que apresenta tendência nula desde 1985 até 2020.`;
            if (annualRate > 0) {
              AooThreatText = `Em ${lastYear}, a espécie apresentava ${lastYearPercentage.replace(
                '.',
                ',',
              )}% (${lastYearKm2.replace(
                '.',
                ',',
              )} km²) da sua AOO convertidos em áreas de ${threatName}, atividade que cresce a uma taxa de ${annualRate.replace(
                '.',
                ',',
              )}% aa desde 1985 até 2020 [valor-p: ${pValue}; R²: ${rSquared}].`;
            }
            if (annualRate < 0) {
              AooThreatText = `Em ${lastYear}, a espécie apresentava ${lastYearPercentage.replace(
                '.',
                ',',
              )}% (${lastYearKm2.replace(
                '.',
                ',',
              )} km²) da sua AOO convertidos em áreas de ${threatName}, atividade que diminui a uma taxa de ${annualRate.replace(
                '.',
                ',',
              )}% aa desde 1985 até 2020 [valor-p: ${pValue}; R²: ${rSquared}].`;
            }

            AooThreatText = AooThreatText.replace(
              'áreas de área urbanizada',
              'área urbanizada',
            );

            const AooThreatInfo = {
              threat: threatsIUCN[threatName],
              text: AooThreatText,
              reference: `MapBiomas, 2022. Projeto MapBiomas - Coleção 7 da Série Anual de Mapas de Cobertura e Uso de Solo do Brasil, dados de 1985 e 2021. URL https://https://mapbiomas.org (acesso em ${date}).`,
            };
            AooThreatsList.push(AooThreatInfo);
          }

          let EooThreatsList = [];
          for (const threat of EooThreats) {
            const lastYear = threat.lastYear;
            const lastYearPercentage = threat.lastYear_percentage.toFixed(2);
            const lastYearKm2 = threat.lastYear_km2.toFixed(2);
            const annualRate = threat.trendAnalysis.annualRate.toFixed(2);
            const pValue = threat.trendAnalysis.pValue.toExponential(4);
            const rSquared = threat.trendAnalysis.rSquared.toFixed(4);
            const threatName = threat.threat;

            let EooThreatText = `Em ${lastYear}, a espécie apresentava ${lastYearPercentage.replace(
              '.',
              ',',
            )}% (${lastYearKm2.replace(
              '.',
              ',',
            )} km²) da sua EOO convertidos em áreas de ${threatName}, atividade que apresenta tendência nula desde 1985 até 2020.`;
            if (annualRate > 0) {
              EooThreatText = `Em ${lastYear}, a espécie apresentava ${lastYearPercentage.replace(
                '.',
                ',',
              )}% (${lastYearKm2.replace(
                '.',
                ',',
              )} km²) da sua EOO convertidos em áreas de ${threatName}, atividade que cresce a uma taxa de ${annualRate.replace(
                '.',
                ',',
              )}% aa desde 1985 até 2020 [valor-p: ${pValue}; R²: ${rSquared}].`;
            }
            if (annualRate < 0) {
              EooThreatText = `Em ${lastYear}, a espécie apresentava ${lastYearPercentage.replace(
                '.',
                ',',
              )}% (${lastYearKm2.replace(
                '.',
                ',',
              )} km²) da sua EOO convertidos em áreas de ${threatName}, atividade que diminui a uma taxa de ${annualRate.replace(
                '.',
                ',',
              )}% aa desde 1985 até 2020 [valor-p: ${pValue}; R²: ${rSquared}].`;
            }

            EooThreatText = EooThreatText.replace(
              'áreas de área urbanizada',
              'área urbanizada',
            );

            const EooThreatInfo = {
              threat: threatsIUCN[threatName],
              text: EooThreatText,
              reference: `MapBiomas, 2022. Projeto MapBiomas - Coleção 7 da Série Anual de Mapas de Cobertura e Uso de Solo do Brasil, dados de 1985 e 2021. URL https://https://mapbiomas.org (acesso em ${date}).`,
            };
            EooThreatsList.push(EooThreatInfo);
          }

          function mergeThreatsText(threatsList: any) {
            const mergedThreats: any = {};

            threatsList.forEach((item: any) => {
              if (!mergedThreats[item.threat]) {
                mergedThreats[item.threat] = {
                  threat: item.threat,
                  text: item.text,
                  reference: item.reference,
                };
              } else {
                mergedThreats[item.threat].text += ' ' + item.text;
              }
            });

            return Object.values(mergedThreats);
          }

          // Mesclar AooThreatsList
          const mergedAooThreatsList = mergeThreatsText(AooThreatsList);

          // Mesclar EooThreatsList
          const mergedEooThreatsList = mergeThreatsText(EooThreatsList);

          // Mesclar ambos (Aoo e Eoo)
          const mergedThreatsList = mergeThreatsText([
            ...mergedAooThreatsList,
            ...mergedEooThreatsList,
          ]);

          const landCoverThreatsList: any = Object.values(mergedThreatsList);


          // MapBiomas fire

          const AooFireThreats = output.threats.AOOfire;
          const EooFireThreats = output.threats.EOOfire;

          AooFireThreats.sort((a: any, b: any) => b.percent - a.percent);
          EooFireThreats.sort((a: any, b: any) => b.percent - a.percent);

          if (AooFireThreats.length === 0 && EooFireThreats.length === 0) {
            output.threats.includeThreat = [
              {
                threat: 'Nenhuma ameaça significativa relacionado ao fogo.',
                text: '',
                reference: '',
              },
            ];
          }

          let FireThreatsList: any = [];
          if (AooFireThreats.length !== 0 && EooFireThreats.length !== 0) {
            let totalPercentAoo = 0;
            let totalKm2Aoo = 0;
            for (const threat of AooFireThreats) {
              totalPercentAoo += threat.percent;
              totalKm2Aoo += threat.km2;
            }

            let fireThreatText: string = `Um total de ${totalPercentAoo.toFixed(
              2,
            )}% (${totalKm2Aoo.toFixed(
              2,
            )} km²) da AOO útil da espécie queimaram em ${AooFireThreats[0].year
              } [`;

            for (let i = 0; i < AooFireThreats.length; i++) {
              fireThreatText += `${AooFireThreats[i].class} (${AooFireThreats[
                i
              ].percent.toFixed(2)}%)`;

              if (i !== AooFireThreats.length - 1) {
                fireThreatText += ', ';
              }
            }

            fireThreatText += ']. ';

            let totalPercentEoo = 0;
            let totalKm2Eoo = 0;
            for (const threat of EooFireThreats) {
              totalPercentAoo += threat.percent;
              totalKm2Aoo += threat.km2;
            }

            fireThreatText += `Um total de ${totalPercentEoo.toFixed(
              2,
            )}% (${totalKm2Eoo.toFixed(
              2,
            )} km²) da EOO útil da espécie queimaram em ${EooFireThreats[0].year
              } [`;

            for (let i = 0; i < EooFireThreats.length; i++) {
              fireThreatText += `${EooFireThreats[i].class} (${EooFireThreats[
                i
              ].percent.toFixed(2)}%)`;

              if (i !== EooFireThreats.length - 1) {
                fireThreatText += ', ';
              }
            }

            fireThreatText += '].';

            const fireThreatInfo = {
              threat: '7.1.3 Trend Unknown/Unrecorded',
              text: fireThreatText,
              reference: `MapBiomas Fogo, 2022. Projeto MapBiomas Fogo - Coleção 2 do Mapeamento de cicatrizes de fogo no Brasil, dados de 2022. URL https://https://mapbiomas.org (acesso em ${date}).`,
            };
            FireThreatsList.push(fireThreatInfo);
          }

          if (AooFireThreats.length !== 0 && EooFireThreats.length === 0) {
            let totalPercentAoo = 0;
            let totalKm2Aoo = 0;
            for (const threat of AooFireThreats) {
              totalPercentAoo += threat.percent;
              totalKm2Aoo += threat.km2;
            }

            let AooFireThreatText = `Um total de ${totalPercentAoo.toFixed(
              2,
            )}% (${totalKm2Aoo.toFixed(
              2,
            )} km²) da AOO útil da espécie queimaram em ${AooFireThreats[0].year
              } [`;

            for (let i = 0; i < AooFireThreats.length; i++) {
              AooFireThreatText += `${AooFireThreats[i].class
                } (${AooFireThreats[i].percent.toFixed(2)}%)`;

              if (i !== AooFireThreats.length - 1) {
                AooFireThreatText += ', ';
              }
            }

            AooFireThreatText += '].';

            const AooFireThreatInfo = {
              threat: '7.1.3 Trend Unknown/Unrecorded',
              text: AooFireThreatText,
              reference: `MapBiomas Fogo, 2022. Projeto MapBiomas Fogo - Coleção 2 do Mapeamento de cicatrizes de fogo no Brasil, dados de 2022. URL https://https://mapbiomas.org (acesso em ${date}).`,
            };
            FireThreatsList.push(AooFireThreatInfo);
          }

          if (AooFireThreats.length === 0 && EooFireThreats.length !== 0) {
            let totalPercentEoo = 0;
            let totalKm2Eoo = 0;
            for (const threat of EooFireThreats) {
              totalPercentEoo += threat.percent;
              totalKm2Eoo += threat.km2;
            }

            let EooFireThreatText = `Um total de ${totalPercentEoo.toFixed(
              2,
            )}% (${totalKm2Eoo.toFixed(
              2,
            )} km²) da EOO útil da espécie queimaram em ${EooFireThreats[0].year
              } [`;

            for (let i = 0; i < EooFireThreats.length; i++) {
              EooFireThreatText += `${EooFireThreats[i].class
                } (${EooFireThreats[i].percent.toFixed(2)}%)`;

              if (i !== EooFireThreats.length - 1) {
                EooFireThreatText += ', ';
              }
            }

            EooFireThreatText += '].';

            const EooFireThreatInfo = {
              threat: '7.1.3 Trend Unknown/Unrecorded',
              text: EooFireThreatText,
              reference: `MapBiomas Fogo, 2022. Projeto MapBiomas Fogo - Coleção 2 do Mapeamento de cicatrizes de fogo no Brasil, dados de 2022. URL https://https://mapbiomas.org (acesso em ${date}).`,
            };
            FireThreatsList.push(EooFireThreatInfo);
          }

          // Merge threatsLists (land cover, fire)
          const threatsList = landCoverThreatsList.concat(FireThreatsList);

          output.threats.includeThreat = threatsList;
        }

        if (AooThreats.length !== 0 && EooThreats.length === 0) {
          let AooThreatsList = [];
          for (const threat of AooThreats) {
            const lastYear = threat.lastYear;
            const lastYearPercentage = threat.lastYear_percentage.toFixed(2);
            const lastYearKm2 = threat.lastYear_km2.toFixed(2);
            const annualRate = threat.trendAnalysis.annualRate.toFixed(2);
            const pValue = threat.trendAnalysis.pValue.toExponential(4);
            const rSquared = threat.trendAnalysis.rSquared.toFixed(4);
            const threatName = threat.threat;

            let AooThreatText = `Em ${lastYear}, a espécie apresentava ${lastYearPercentage.replace(
              '.',
              ',',
            )}% (${lastYearKm2.replace(
              '.',
              ',',
            )} km²) da sua AOO convertidos em áreas de ${threatName}, atividade que apresenta tendência nula desde 1985 até 2020.`;
            if (annualRate > 0) {
              AooThreatText = `Em ${lastYear}, a espécie apresentava ${lastYearPercentage.replace(
                '.',
                ',',
              )}% (${lastYearKm2.replace(
                '.',
                ',',
              )} km²) da sua AOO convertidos em áreas de ${threatName}, atividade que cresce a uma taxa de ${annualRate.replace(
                '.',
                ',',
              )}% aa desde 1985 até 2020 [valor-p: ${pValue}; R²: ${rSquared}].`;
            }
            if (annualRate < 0) {
              AooThreatText = `Em ${lastYear}, a espécie apresentava ${lastYearPercentage.replace(
                '.',
                ',',
              )}% (${lastYearKm2.replace(
                '.',
                ',',
              )} km²) da sua AOO convertidos em áreas de ${threatName}, atividade que diminui a uma taxa de ${annualRate.replace(
                '.',
                ',',
              )}% aa desde 1985 até 2020 [valor-p: ${pValue}; R²: ${rSquared}].`;
            }

            AooThreatText = AooThreatText.replace(
              'áreas de área urbanizada',
              'área urbanizada',
            );

            const AooThreatInfo = {
              threat: threatsIUCN[threatName],
              text: AooThreatText.replace(/\.$/, ' (MapBiomas, 2022).'),
              reference: `MapBiomas, 2022. Projeto MapBiomas - Coleção 7 da Série Anual de Mapas de Cobertura e Uso de Solo do Brasil, dados de 1985 e 2021. URL https://https://mapbiomas.org (acesso em ${date}).`,
            };
            AooThreatsList.push(AooThreatInfo);
          }

          let AooThreatsListMerged = AooThreatsList.filter(
            (item) => item.threat === '2.1.4 Scale Unknown/Unrecorded',
          );
          let AooThreatsListNotMerged = AooThreatsList.filter(
            (item) => item.threat !== '2.1.4 Scale Unknown/Unrecorded',
          );
          if (AooThreatsListMerged.length >= 2) {
            const firstItem = AooThreatsListMerged[0];
            const secondItem = AooThreatsListMerged[1];

            firstItem.text += ' ' + secondItem.text;

            AooThreatsList.splice(AooThreatsList.indexOf(secondItem), 1);
          }
          AooThreatsListMerged = AooThreatsListMerged.concat(
            AooThreatsListNotMerged,
          );

          AooThreatsListMerged = AooThreatsList.filter(
            (item) => item.threat === '2.3.4 Scale Unknown/Unrecorded',
          );
          AooThreatsListNotMerged = AooThreatsList.filter(
            (item) => item.threat !== '2.3.4 Scale Unknown/Unrecorded',
          );
          if (AooThreatsListMerged.length >= 2) {
            const firstItem = AooThreatsListMerged[0];
            const secondItem = AooThreatsListMerged[1];

            firstItem.text += ' ' + secondItem.text;

            AooThreatsList.splice(AooThreatsList.indexOf(secondItem), 1);
          }
          const landCoverThreatsList = AooThreatsListMerged.concat(
            AooThreatsListNotMerged,
          );

          // MapBiomas fire
          
          const AooFireThreats = output.threats.AOOfire;
          const EooFireThreats = output.threats.EOOfire;

          AooFireThreats.sort((a: any, b: any) => b.percent - a.percent);
          EooFireThreats.sort((a: any, b: any) => b.percent - a.percent);

          if (AooFireThreats.length === 0 && EooFireThreats.length === 0) {
            output.threats.includeThreat = [
              {
                threat: 'Nenhuma ameaça significativa relacionado ao fogo.',
                text: '',
                reference: '',
              },
            ];
          }

          let FireThreatsList: any = [];
          if (AooFireThreats.length !== 0 && EooFireThreats.length !== 0) {
            let totalPercentAoo = 0;
            let totalKm2Aoo = 0;
            for (const threat of AooFireThreats) {
              totalPercentAoo += threat.percent;
              totalKm2Aoo += threat.km2;
            }

            let fireThreatText: string = `Um total de ${totalPercentAoo.toFixed(
              2,
            )}% (${totalKm2Aoo.toFixed(
              2,
            )} km²) da AOO útil da espécie queimaram em ${AooFireThreats[0].year
              } [`;

            for (let i = 0; i < AooFireThreats.length; i++) {
              fireThreatText += `${AooFireThreats[i].class} (${AooFireThreats[
                i
              ].percent.toFixed(2)}%)`;

              if (i !== AooFireThreats.length - 1) {
                fireThreatText += ', ';
              }
            }

            fireThreatText += ']. ';

            let totalPercentEoo = 0;
            let totalKm2Eoo = 0;
            for (const threat of EooFireThreats) {
              totalPercentAoo += threat.percent;
              totalKm2Aoo += threat.km2;
            }

            fireThreatText += `Um total de ${totalPercentEoo.toFixed(
              2,
            )}% (${totalKm2Eoo.toFixed(
              2,
            )} km²) da EOO útil da espécie queimaram em ${EooFireThreats[0].year
              } [`;

            for (let i = 0; i < EooFireThreats.length; i++) {
              fireThreatText += `${EooFireThreats[i].class} (${EooFireThreats[
                i
              ].percent.toFixed(2)}%)`;

              if (i !== EooFireThreats.length - 1) {
                fireThreatText += ', ';
              }
            }

            fireThreatText += '].';

            const fireThreatInfo = {
              threat: '7.1.3 Trend Unknown/Unrecorded',
              text: fireThreatText,
              reference: `MapBiomas Fogo, 2022. Projeto MapBiomas Fogo - Coleção 2 do Mapeamento de cicatrizes de fogo no Brasil, dados de 2022. URL https://https://mapbiomas.org (acesso em ${date}).`,
            };
            FireThreatsList.push(fireThreatInfo);
          }

          if (AooFireThreats.length !== 0 && EooFireThreats.length === 0) {
            let totalPercentAoo = 0;
            let totalKm2Aoo = 0;
            for (const threat of AooFireThreats) {
              totalPercentAoo += threat.percent;
              totalKm2Aoo += threat.km2;
            }

            let AooFireThreatText = `Um total de ${totalPercentAoo.toFixed(
              2,
            )}% (${totalKm2Aoo.toFixed(
              2,
            )} km²) da AOO útil da espécie queimaram em ${AooFireThreats[0].year
              } [`;
            
            for (let i = 0; i < AooFireThreats.length; i++) {
              
              AooFireThreatText += `${AooFireThreats[i].class
                } (${AooFireThreats[i].percent.toFixed(2)}%)`;

              if (i !== AooFireThreats.length - 1) {
                AooFireThreatText += ', ';
              }
            }

            AooFireThreatText += '].';

            const AooFireThreatInfo = {
              threat: '7.1.3 Trend Unknown/Unrecorded',
              text: AooFireThreatText,
              reference: `MapBiomas Fogo, 2022. Projeto MapBiomas Fogo - Coleção 2 do Mapeamento de cicatrizes de fogo no Brasil, dados de 2022. URL https://https://mapbiomas.org (acesso em ${date}).`,
            };
            FireThreatsList.push(AooFireThreatInfo);
          }

          if (AooFireThreats.length === 0 && EooFireThreats.length !== 0) {
            let totalPercentEoo = 0;
            let totalKm2Eoo = 0;
            for (const threat of EooFireThreats) {
              totalPercentEoo += threat.percent;
              totalKm2Eoo += threat.km2;
            }

            let EooFireThreatText = `Um total de ${totalPercentEoo.toFixed(
              2,
            )}% (${totalKm2Eoo.toFixed(
              2,
            )} km²) da EOO útil da espécie queimaram em ${EooFireThreats[0].year
              } [`;

            for (let i = 0; i < EooFireThreats.length; i++) {
              EooFireThreatText += `${EooFireThreats[i].class
                } (${EooFireThreats[i].percent.toFixed(2)}%)`;

              if (i !== EooFireThreats.length - 1) {
                EooFireThreatText += ', ';
              }
            }

            EooFireThreatText += '].';

            const EooFireThreatInfo = {
              threat: '7.1.3 Trend Unknown/Unrecorded',
              text: EooFireThreatText,
              reference: `MapBiomas Fogo, 2022. Projeto MapBiomas Fogo - Coleção 2 do Mapeamento de cicatrizes de fogo no Brasil, dados de 2022. URL https://https://mapbiomas.org (acesso em ${date}).`,
            };
            FireThreatsList.push(EooFireThreatInfo);
          }

          // Merge threatsLists (land cover, fire)
          const threatsList = landCoverThreatsList.concat(FireThreatsList);

          output.threats.includeThreat = threatsList;
        }

        if (AooThreats.length === 0 && EooThreats.length !== 0) {
          let EooThreatsList = [];
          for (const threat of EooThreats) {
            const lastYear = threat.lastYear;
            const lastYearPercentage = threat.lastYear_percentage.toFixed(2);
            const lastYearKm2 = threat.lastYear_km2.toFixed(2);
            const annualRate = threat.trendAnalysis.annualRate.toFixed(2);
            const pValue = threat.trendAnalysis.pValue.toExponential(4);
            const rSquared = threat.trendAnalysis.rSquared.toFixed(4);
            const threatName = threat.threat;

            let EooThreatText = `Em ${lastYear}, a espécie apresentava ${lastYearPercentage.replace(
              '.',
              ',',
            )}% (${lastYearKm2.replace(
              '.',
              ',',
            )} km²) da sua EOO convertidos em áreas de ${threatName}, atividade que apresenta tendência nula desde 1985 até 2020.`;
            if (annualRate > 0) {
              EooThreatText = `Em ${lastYear}, a espécie apresentava ${lastYearPercentage.replace(
                '.',
                ',',
              )}% (${lastYearKm2.replace(
                '.',
                ',',
              )} km²) da sua EOO convertidos em áreas de ${threatName}, atividade que cresce a uma taxa de ${annualRate.replace(
                '.',
                ',',
              )}% aa desde 1985 até 2020 [valor-p: ${pValue}; R²: ${rSquared}].`;
            }
            if (annualRate < 0) {
              EooThreatText = `Em ${lastYear}, a espécie apresentava ${lastYearPercentage.replace(
                '.',
                ',',
              )}% (${lastYearKm2.replace(
                '.',
                ',',
              )} km²) da sua EOO convertidos em áreas de ${threatName}, atividade que diminui a uma taxa de ${annualRate.replace(
                '.',
                ',',
              )}% aa desde 1985 até 2020 [valor-p: ${pValue}; R²: ${rSquared}].`;
            }

            EooThreatText = EooThreatText.replace(
              'áreas de área urbanizada',
              'área urbanizada',
            );

            const EooThreatInfo = {
              threat: threatsIUCN[threatName],
              text: EooThreatText.replace(/\.$/, ' (MapBiomas, 2022).'),
              reference: `MapBiomas, 2022. Projeto MapBiomas - Coleção 7 da Série Anual de Mapas de Cobertura e Uso de Solo do Brasil, dados de 1985 e 2021. URL https://https://mapbiomas.org (acesso em ${date}).`,
            };
            EooThreatsList.push(EooThreatInfo);
          }

          let EooThreatsListMerged = EooThreatsList.filter(
            (item) => item.threat === '2.1.4 Scale Unknown/Unrecorded',
          );
          let EooThreatsListNotMerged = EooThreatsList.filter(
            (item) => item.threat !== '2.1.4 Scale Unknown/Unrecorded',
          );
          if (EooThreatsListMerged.length >= 2) {
            const firstItem = EooThreatsListMerged[0];
            const secondItem = EooThreatsListMerged[1];

            firstItem.text += ' ' + secondItem.text;

            EooThreatsList.splice(EooThreatsList.indexOf(secondItem), 1);
          }
          EooThreatsListMerged = EooThreatsListMerged.concat(
            EooThreatsListNotMerged,
          );

          EooThreatsListMerged = EooThreatsList.filter(
            (item) => item.threat === '2.3.4 Scale Unknown/Unrecorded',
          );
          EooThreatsListNotMerged = EooThreatsList.filter(
            (item) => item.threat !== '2.3.4 Scale Unknown/Unrecorded',
          );
          if (EooThreatsListMerged.length >= 2) {
            const firstItem = EooThreatsListMerged[0];
            const secondItem = EooThreatsListMerged[1];

            firstItem.text += ' ' + secondItem.text;

            EooThreatsList.splice(EooThreatsList.indexOf(secondItem), 1);
          }
          const landCoverThreatsList = EooThreatsListMerged.concat(
            EooThreatsListNotMerged,
          );

          // MapBiomas fire

          const AooFireThreats = output.threats.AOOfire;
          const EooFireThreats = output.threats.EOOfire;

          AooFireThreats.sort((a: any, b: any) => b.percent - a.percent);
          EooFireThreats.sort((a: any, b: any) => b.percent - a.percent);

          if (AooFireThreats.length === 0 && EooFireThreats.length === 0) {
            output.threats.includeThreat = [
              {
                threat: 'Nenhuma ameaça significativa relacionado ao fogo.',
                text: '',
                reference: '',
              },
            ];
          }

          let FireThreatsList: any = [];
          if (AooFireThreats.length !== 0 && EooFireThreats.length !== 0) {
            let totalPercentAoo = 0;
            let totalKm2Aoo = 0;
            for (const threat of AooFireThreats) {
              totalPercentAoo += threat.percent;
              totalKm2Aoo += threat.km2;
            }

            let fireThreatText: string = `Um total de ${totalPercentAoo.toFixed(
              2,
            )}% (${totalKm2Aoo.toFixed(
              2,
            )} km²) da AOO útil da espécie queimaram em ${AooFireThreats[0].year
              } [`;

            for (let i = 0; i < AooFireThreats.length; i++) {
              fireThreatText += `${AooFireThreats[i].class} (${AooFireThreats[
                i
              ].percent.toFixed(2)}%)`;

              if (i !== AooFireThreats.length - 1) {
                fireThreatText += ', ';
              }
            }

            fireThreatText += ']. ';

            let totalPercentEoo = 0;
            let totalKm2Eoo = 0;
            for (const threat of EooFireThreats) {
              totalPercentAoo += threat.percent;
              totalKm2Aoo += threat.km2;
            }

            fireThreatText += `Um total de ${totalPercentEoo.toFixed(
              2,
            )}% (${totalKm2Eoo.toFixed(
              2,
            )} km²) da EOO útil da espécie queimaram em ${EooFireThreats[0].year
              } [`;

            for (let i = 0; i < EooFireThreats.length; i++) {
              fireThreatText += `${EooFireThreats[i].class} (${EooFireThreats[
                i
              ].percent.toFixed(2)}%)`;

              if (i !== EooFireThreats.length - 1) {
                fireThreatText += ', ';
              }
            }

            fireThreatText += '].';

            const fireThreatInfo = {
              threat: '7.1.3 Trend Unknown/Unrecorded',
              text: fireThreatText,
              reference: `MapBiomas Fogo, 2022. Projeto MapBiomas Fogo - Coleção 2 do Mapeamento de cicatrizes de fogo no Brasil, dados de 2022. URL https://https://mapbiomas.org (acesso em ${date}).`,
            };
            FireThreatsList.push(fireThreatInfo);
          }

          if (AooFireThreats.length !== 0 && EooFireThreats.length === 0) {
            let totalPercentAoo = 0;
            let totalKm2Aoo = 0;
            for (const threat of AooFireThreats) {
              totalPercentAoo += threat.percent;
              totalKm2Aoo += threat.km2;
            }

            let AooFireThreatText = `Um total de ${totalPercentAoo.toFixed(
              2,
            )}% (${totalKm2Aoo.toFixed(
              2,
            )} km²) da AOO útil da espécie queimaram em ${AooFireThreats[0].year
              } [`;

            for (let i = 0; i < AooFireThreats.length; i++) {
              AooFireThreatText += `${AooFireThreats[i].class
                } (${AooFireThreats[i].percent.toFixed(2)}%)`;

              if (i !== AooFireThreats.length - 1) {
                AooFireThreatText += ', ';
              }
            }

            AooFireThreatText += '].';

            const AooFireThreatInfo = {
              threat: '7.1.3 Trend Unknown/Unrecorded',
              text: AooFireThreatText,
              reference: `MapBiomas Fogo, 2022. Projeto MapBiomas Fogo - Coleção 2 do Mapeamento de cicatrizes de fogo no Brasil, dados de 2022. URL https://https://mapbiomas.org (acesso em ${date}).`,
            };
            FireThreatsList.push(AooFireThreatInfo);
          }

          if (AooFireThreats.length === 0 && EooFireThreats.length !== 0) {
            let totalPercentEoo = 0;
            let totalKm2Eoo = 0;
            for (const threat of EooFireThreats) {
              totalPercentEoo += threat.percent;
              totalKm2Eoo += threat.km2;
            }

            let EooFireThreatText = `Um total de ${totalPercentEoo.toFixed(
              2,
            )}% (${totalKm2Eoo.toFixed(
              2,
            )} km²) da EOO útil da espécie queimaram em ${EooFireThreats[0].year
              } [`;

            for (let i = 0; i < EooFireThreats.length; i++) {
              EooFireThreatText += `${EooFireThreats[i].class
                } (${EooFireThreats[i].percent.toFixed(2)}%)`;

              if (i !== EooFireThreats.length - 1) {
                EooFireThreatText += ', ';
              }
            }

            EooFireThreatText += '].';

            const EooFireThreatInfo = {
              threat: '7.1.3 Trend Unknown/Unrecorded',
              text: EooFireThreatText,
              reference: `MapBiomas Fogo, 2022. Projeto MapBiomas Fogo - Coleção 2 do Mapeamento de cicatrizes de fogo no Brasil, dados de 2022. URL https://https://mapbiomas.org (acesso em ${date}).`,
            };
            FireThreatsList.push(EooFireThreatInfo);
          }

          // Merge threatsLists (land cover, fire)
          const threatsList = landCoverThreatsList.concat(FireThreatsList);

          output.threats.includeThreat = threatsList;
        }

        return getHTMLString(output);
      })
      .then((htmlString: any) => {
        fs.writeFileSync(
          `G:/Outros computadores/Meu computador/CNCFlora_data/outputs/profileOfSpeciesHTML results/${species}.html`,
          htmlString,
        );
      })
      .catch((error) => {
        console.error(error);
      });

    function getHTMLString(data: any) {
      return new Promise((resolve, reject) => {
        ejs.renderFile(
          './src/queues/speciesProfile_template/index.ejs',
          data,
          (err, str) => {
            if (err) {
              console.error(err);
              reject(err);
              return;
            }

            resolve(str);
          },
        );
      });
    }

    job.updateProgress(100);

    return Promise.resolve(
      'G:/Outros computadores/Meu computador/CNCFlora_data/speciesProfiles/' +
      species +
      '.html',
    );
  }
  catch(err: Error) {
    console.error(err);
    return null;
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    const message = `Active #${job.id} - ${job.data.species}`;
    const blueMessage = `\x1b[34m${message}\x1b[0m`;
    this.logger.log(blueMessage);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Completed #${job.id} - ${job.data.species}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    const message = `Failed #${job.id} - ${job.data.species}`;
    const redMessage = `\x1b[31m${message}\x1b[0m`;
    this.logger.log(redMessage);
  }
}
