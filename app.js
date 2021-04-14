const puppy=require("puppeteer")

const fs=require("fs");

let upcomminginfo={};
let liveinfo={};


let file=fs.readFileSync("info.txt","utf-8");
let splitedfile=file.split("\r\n");
let candidateInfo={}

for(let i=0;i<splitedfile.length;i++){
    let arr=splitedfile[i].split(":");
    candidateInfo[arr[0]]=arr[1];
}
// console.log(candidateInfo);

async function main(){
        
    const browser= await puppy.launch({
        headless:false,
        defaultViewPort:false,
        args: ["--start-maximized"]
    });

    let tabs=await browser.pages();
    let tab=tabs[0];
    await tab.goto("https://www.hackerearth.com/",{ timeout: 0});
    let buttons=await tab.$$(".buttonText");
    await buttons[0].click();
    await tab.waitForSelector("input[name='username']",{visible:true});
    await tab.type("input[name='username']",candidateInfo["gmail"]);
    await tab.type("input[name='password']",candidateInfo["password"]);
    await tab.click(".submitButton");

    await tab.waitForSelector("#id_is_competitive",{visible:true});
    await tab.$eval("#id_is_competitive",e1=>{e1.click()});

    await tab.waitForSelector("#id_is_hackathon",{visible:true});
    await tab.$eval("#id_is_hackathon",e1=>{e1.click()});

    let ontitles=[],onday0=[],onday1=[],onurls=[];
    await tab.waitForSelector(".ongoing .challenge-name");
    let oncomp=await tab.$$(".ongoing .challenge-name");
    let onday1promise=await tab.$$("#days-1");
    let onday0promise=await tab.$$("#days-0");
    
    await tab.waitForSelector(".ongoing .challenge-card-wrapper.challenge-card-link")

    let ongoingDivs=await tab.$$(".ongoing .challenge-card-wrapper.challenge-card-link");

    for(let i=0;i<oncomp.length;i++){
            ontitles.push(await tab.evaluate((ele)=>{
                return ele.getAttribute("title");
            },oncomp[i]));

            onday1.push(await tab.evaluate((ele)=>{
                return ele.innerText;
            },onday1promise[i]));

            onday0.push(await tab.evaluate((ele)=>{
                return ele.innerText;
            },onday0promise[i]));

            onurls.push(await tab.evaluate((ele)=>{
                let url=ele.getAttribute("href");
                if(url[0]=='/') return "https://www.hackerearth.com"+url;
                else return url;
            },ongoingDivs[i]));
            
    }
    
    // console.log(onurls);
    // console.log(ontitles);
    // console.log(onday1,onday0);

    
    for(let i=0;i<onurls.length;i++){
    liveinfo[onurls[i]]={};
    liveinfo[onurls[i]]["type"]="Live";
    liveinfo[onurls[i]]["title"]=ontitles[i];
    liveinfo[onurls[i]]["Ends in"]=onday1[i]+onday0[i]+" days";
    }
    fs.writeFileSync("live-info.json",JSON.stringify(liveinfo));
 
    // Upcomming 
    await tab.waitForSelector(".upcoming .challenge-card-wrapper.challenge-card-link",{visible:true});
    let upcommingDivs=await tab.$$(".upcoming .challenge-card-wrapper.challenge-card-link");
    let upurls=[]
    for(let i=0;i<upcommingDivs.length;i++){
        let url=await tab.evaluate((ele)=>{
            return ele.getAttribute("href");
        },upcommingDivs[i]);
        
    upurls.push(url);
    }
    
    for(let i=0;i<upurls.length;i++){
        if(upurls[i][0]=='/'){
            upurls[i]="https://www.hackerearth.com"+upurls[i];
        }
    }
    
    jobsdone(browser,tab);
    for(let i=0;i<upurls.length;i++){
        await upcommingfun(browser,upurls[i]);
    }

    fs.writeFileSync("upcoming-info.json",JSON.stringify(upcomminginfo));
    
}
async function jobsdone(browser,tab){
    await tab.goto("https://www.hackerearth.com/companies/",{timeout:0});
    let jobsele=await tab.$$(".company-card-container");
    let urlele=[];
    for(let i=0;i<jobsele.length;i++){
        urlele.push(await tab.evaluate((ele)=>{
            return "https://www.hackerearth.com"+ele.getAttribute("link");
        },jobsele[i]));
    }
    // change
    for(let i=0;i<urlele.length;i++) await applyjob(browser,urlele[i]);
    await tab.close();   
}

async function applyjob(browser,url){
    let tab=await browser.newPage();
    await tab.goto(url+"jobs/",{ timeout: 0});
    // console.log(url);
    try{
        await tab.waitForSelector(".job-card .button",{visible:true});
        let jobscard=await tab.$$(".job-card .button");
        let jobsdetails=[]
        for(let i=0;i<jobscard.length;i++){
            jobsdetails.push(await tab.evaluate((ele)=>{
                return "https://www.hackerearth.com"+ele.getAttribute("href");
            },jobscard[i]));
        }
        // console.log(jobscard.length);
        // change
        for(let i=0;i<jobsdetails.length;i++){
        applyjobsurl(browser,jobsdetails[i]);
        }
        await tab.close();

    }catch{
        console.log("error in applyjob at url "+url);
    }
}

async function applyjobsurl(browser,url){
    let tab=await browser.newPage();
    // console.log(url);
    await tab.goto(url,{ timeout: 0});
    // apply button
    try{
        await tab.click(".button.btn-blue.btn-small.less-margin-left");
        
    }catch{
        console.log("Already applied to "+ url);
    }finally{
        await tab.close();
    }
}
async function upcommingfun(browser,url){

    let tab=await browser.newPage();
    await tab.goto(url,{ timeout: 0});
    try{
    upcomminginfo[url]={};
    upcomminginfo[url]["type"]="Hiring";
    await tab.waitForSelector(".event-title.dark.larger",{visible:true});
    let title=await tab.$(".event-title.dark.larger");
    let titlename=await tab.evaluate((ele)=>{
        return ele.getAttribute("title");
    },title);
    upcomminginfo[url]["name"]=titlename;
    let timings=await tab.$$(".timing-text.dark.regular.weight-700");
    let time=[];
    for(let i=0;i<timings.length;i++){
        time[i]=await tab.evaluate((ele)=>{
            return ele.innerText;
        },timings[i]);
    }
    // console.log(time);
    upcomminginfo[url]["start"]=time[0];
    upcomminginfo[url]["end"]=time[1];
    upcomminginfo[url]["duration"]=time[2];
    
    
    await tab.waitForSelector(".track-register-click");
    await tab.click(".track-register-click");
    await tab.waitForSelector("#id_gender");
    await tab.select("#id_gender",candidateInfo["gender"]);
    await tab.waitForSelector("#id_city");
    await tab.type("#id_city",candidateInfo["city"]);
    await tab.waitForSelector("#id_phone_code");
    await tab.type("#id_phone_code",candidateInfo["phonecode"]);
    await tab.type("#id_phone_number",candidateInfo["number"]);
    await tab.waitForSelector("#id_institute");
    await tab.type("#id_institute",candidateInfo["university"]);
    await tab.type(".selectize-input.items.not-full.has-options input",candidateInfo["type"]);
    await tab.keyboard.press("Enter");
    await tab.type(".selectize-input.items.not-full input",candidateInfo["branch"]);
    await tab.keyboard.press("Enter");
    await tab.waitForSelector("#id_graduation_year");
    await tab.select("#id_graduation_year",candidateInfo["graduation"]);
    try{
        await tab.type("#id_cgpa",candidateInfo["CGPA"]);
    }catch{

    }
    try{
        await tab.select("#id_Are you willing to relocate to Bangalore for this job?10247",candidateInfo[relocate]);
    }catch{}

    await tab.select("#id_years_of_experience",candidateInfo["exp"]);
    await tab.select("#dynamic-data-div select","Yes");
    let uf=await tab.$("#id_resume");
    await uf.uploadFile(candidateInfo["resume"]);
    try{
        await tab.click("input[name='register']");
    }catch{

    }finally{
        
    await tab.close();
    }
    // submit button 
    }
    catch{
        await tab.close();
    }
}

main();