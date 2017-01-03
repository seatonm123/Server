const cheerio = require('cheerio');
const request = require('request');


module.exports = {

    getHTML: function getHTML(requestURL) {
        return new Promise((resolve, reject) => {
            return request(requestURL, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    resolve(body);
                } else {
                    reject(error);
                }
            });
        });
    },

    getPostNumbers: function getPostNumbers(html) {
        let posts = [];
        $ = cheerio.load(html);
        return new Promise((resolve, reject) => {
            $('.type-post').each((i, element) => {
                const longClass = $(element).attr('class');
                const postNumber = longClass.substr(0, longClass.indexOf(' '));
                posts[i] = postNumber;
            });

            if (posts) {
                const postsJSON = {
                    posts
                }
                resolve(postsJSON);
            } else {
                reject();
            }
        });
    },
    getPostLink: function getPostLink(html, post) {
        $ = cheerio.load(html);
        return new Promise((resolve, reject) => {
            const postLink = $(`.${post} a`).first().attr('href');
            if (postLink) {
                resolve(postLink);
            } else {
                reject();
            }

        });
    },
    getEventInfo: function getEventInfo(html, sourceName) {

        $ = cheerio.load(html);
        return new Promise((resolve, reject) => {
            let eventArray = [];
            let typeArray = ["p u", "span[style*='text-decoration:underline;']"];
            typeArray.forEach((type) => {
                $(type).each((i, element) => {
                    let eventObject = {};
                    eventObject.sourceName = sourceName;
                    const parentP = $(element).closest("p");
                    const eventLink = $(parentP).find("a").attr("href");
                    if (eventLink) {
                        eventObject.eventLink = eventLink;
                    }
                    const descriptionP = parentP.next();
                    const descriptionPText = descriptionP.text();
                    eventObject.description = descriptionPText;

                    console.log(descriptionPText);
                    let extractedDate = parentP.children().first();
                    let extractedDateText = extractedDate.text();
                    if (extractedDateText === "") {
                        //some posts have blank <b></b> tags before the date entry
                        extractedDate = extractedDate.siblings().first();
                        extractedDateText = extractedDate.text();
                    }
                    let indexOfAt = extractedDateText.indexOf("@");
                    let indexOfN = extractedDateText.indexOf("n:");
                    let indexOfM = extractedDateText.indexOf("m:");
                    let indexOfS = extractedDateText.indexOf("s:");
                    if (indexOfAt != -1) {
                        const cleanDate = extractedDateText.substring(0, indexOfAt);
                        eventObject.date = cleanDate.trim();

                        if ((indexOfN != -1) || (indexOfM != -1) || (indexOfS != -1)) {
                            let endIndex = null;
                            if (indexOfN != -1) {
                                endIndex = indexOfN + 1;
                            } else if (indexOfM != -1) {
                                endIndex = indexOfM + 1;
                            } else if (indexOfS != -1) {
                                endIndex = indexOfS + 1;
                            }
                            eventObject.time = extractedDateText.substring(indexOfAt, endIndex).replace("@", "").trim();
                            if (extractedDateText[endIndex + 2]) {
                                eventObject.eventName = extractedDateText.substring(endIndex + 2).trim();
                            }
                        } else if (extractedDateText[indexOfAt + 2]) {
                            eventObject.time = extractedDateText.substring(indexOfAt).replace("@", "").trim();
                        } else {

                        }
                    }
                    if (!eventObject.date) {
                        eventObject.date = extractedDateText;
                    }
                    let firstSibling = extractedDate.siblings().first();
                    let firstSiblingText = firstSibling.text();
                    let nextSibling = firstSibling;
                    let nextSiblingText = firstSiblingText;
                    let sibIndex = 1;
                    indexOfAt = firstSiblingText.indexOf("@");
                    indexOfN = firstSiblingText.indexOf("n:");
                    indexOfM = firstSiblingText.indexOf("m:");
                    indexOfS = firstSiblingText.indexOf("s:");

                    if (firstSiblingText[3]) {
                        if ((indexOfN != -1) || (indexOfM != -1) || (indexOfS != -1)) {
                            let endIndex = null;
                            if (indexOfN != -1) {
                                endIndex = indexOfN + 1;
                            } else if (indexOfM != -1) {
                                endIndex = indexOfM + 1;
                            } else if (indexOfS != -1) {
                                endIndex = indexOfS + 1;
                            }
                            if (!eventObject.time) {
                                eventObject.time = firstSiblingText.substring(0, endIndex).replace("@", "").trim();
                            }
                            if (!eventObject.eventName) {
                                if (firstSiblingText[endIndex + 2]) {
                                    eventObject.eventName = firstSiblingText.substring(endIndex + 2).trim();
                                }
                            }

                        } else {
                            if (!eventObject.time) {
                                eventObject.time = firstSiblingText.replace("@", "").trim();
                            }
                        }

                    } else {
                        // move to next sibling for the time
                        nextSibling = firstSibling.siblings().eq(sibIndex);
                        sibIndex += 1;
                        nextSiblingText = nextSibling.text();
                        indexOfAt = nextSiblingText.indexOf("@");
                        indexOfN = nextSiblingText.indexOf("n:");
                        indexOfM = nextSiblingText.indexOf("m:");
                        indexOfS = nextSiblingText.indexOf("s:");

                        if ((indexOfN != -1) || (indexOfM != -1) || (indexOfS != -1)) {
                            let endIndex = null;
                            if (indexOfN != -1) {
                                endIndex = indexOfN + 1;
                            } else if (indexOfM != -1) {
                                endIndex = indexOfM + 1;
                            } else if (indexOfS != -1) {
                                endIndex = indexOfS + 1;
                            }
                            if (!eventObject.time) {
                                eventObject.time = nextSiblingText.substring(0, endIndex).replace("@", "").trim();
                                // console.log(nextSiblingText);
                                // console.log(eventObject.time);
                            }
                            if (!eventObject.eventName) {
                                if (firstSiblingText[endIndex + 2]) {
                                    eventObject.eventName = nextSiblingText.substring(endIndex + 2).trim();
                                    // eventArray.push(eventObject);
                                    // console.log(eventObject.eventName);
                                }
                            }

                        } else {
                            // not sure what happens in this condition... shouldn't they all have one of these?
                            if (!eventObject.time) {
                                eventObject.time = nextSiblingText.replace("@", "").trim();

                            }
                        }
                    }
                    if (!eventObject.eventName) {
                        //move to next sibling(s)for event name info
                        let currentSibling = nextSibling.siblings().eq(sibIndex);

                        let currentSiblingText = currentSibling.text();
                        eventObject.eventName = currentSiblingText;
                        sibIndex += 1;
                        if (nextSibling.siblings().eq(sibIndex)) {
                            currentSibling = nextSibling.siblings().eq(sibIndex);

                            currentSiblingText = currentSibling.text();
                            eventObject.eventName += currentSiblingText;
                        }
                    }

                    eventArray.push(eventObject);
                })
            })
            resolve(eventArray);
        })
    },
    getDateTimePrice: function getDateTimePrice(html) {
      $ = cheerio.load(html);
      return new Promise((resolve, reject) => {
          const timeRaw = $(`.when`).text().replace("Time:","").trim();
          const priceRaw = $(`.price`).text().trim();
          console.log(timeRaw);
          console.log(priceRaw);
          // const dateTimeText = timeLabel.siblings().first().text();
          if (timeRaw) {
              resolve(timeRaw);
          } else {
              reject();
          }

      });
    }
}