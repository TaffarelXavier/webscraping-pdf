const express = require("express");
const router = express.Router();
const https = require("https");
const pdfreader = require("pdfreader");

async function bufferize(url) {
  var hn = url.substring(url.search("//") + 2);
  hn = hn.substring(0, hn.search("/"));
  var pt = url.substring(url.search("//") + 2);
  pt = pt.substring(pt.search("/"));
  const options = { hostname: hn, port: 443, path: pt, method: "GET" };

  return new Promise(function(resolve, reject) {
    var buff = new Buffer.alloc(0);
    const req = https.request(options, res => {
      res.on("data", d => {
        buff = Buffer.concat([buff, d]);
      });
      res.on("end", () => {
        //console.log(buff.toString())
        resolve(buff);
      });
    });
    req.on("error", e => {
      console.error("https request error: " + e);
    });
    req.end();
  });
}

/*
if second param is set then a space ' ' inserted whenever text 
chunks are separated by more than xwidth 
this helps in situations where words appear separated but
this is because of x coords (there are no spaces between words) 

each page is a different array element
*/
async function readlines(buffer, xwidth) {
  return new Promise((resolve, reject) => {
    var pdftxt = new Array();
    var pg = 0;
    var result;
    new pdfreader.PdfReader().parseBuffer(buffer, function(err, item) {
      if (err) console.log("pdf reader error: " + JSON.stringify(err));
      else if (!item) {
        pdftxt.forEach(function(a, idx) {
          pdftxt[idx].forEach(function(v, i) {
            pdftxt[idx][i].splice(1, 2);
          });
        });
        // resolve(pdftxt);
        resolve(pdftxt);
      } else if (item && item.page) {
        pg = item.page - 1;
        pdftxt[pg] = [];
      } else if (item.text) {
        var t = 0;

        var sp = "";

        pdftxt[pg].forEach(function(val, idx) {
          if (val[1] == item.y) {
            if (xwidth && item.x - val[2] > xwidth) {
              sp += " ";
            } else {
              sp = "";
            }
            pdftxt[pg][idx][0] += sp + item.text;
            t = 1;
          }
        });
        //result += item.text;
        if (t == 0) {
          pdftxt[pg].push([item.text, item.y, item.x]);
        }
      }
    });
  });
}

/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index", { title: "Express" });
});

router
  .route("/upload")
  .post(function(req, res, next) {
    const { url } = req.body;

    (async () => {
      var buffer = await bufferize(url);

      var lines = await readlines(buffer);

      var pegarDataAplicacao = /(\d{2}\/\d{1}\/\d{4})/gim;
      var numeroQuestoes = /(\d{10,})$/gm;


      //lines = lines.join(" ");

      /*var gabarito = {
        dataAplicacao: lines.match(pegarDataAplicacao),
        numeroQuestoes:lines.match(numeroQuestoes),
      };*/

      lines =  lines.filter(async (el, index)=>{
       return await el[4].match(/Estado de/i);
      })
  
console.log(lines)
      //lines = lines.split(regex);

      // res.render("index", { url:url, data: lines, linhas: gabarito });
      res.render("index", { url:url});
    })();
  })
  .get(function(req, res, next) {
    res.render("index", { title: "Express" });
  });

module.exports = router;
