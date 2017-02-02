var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

const needle = require("needle"),
    url = require('url'),
    db = require('./db'),
    Users = require('mongoose').model('Users'),
    Sessions = require('mongoose').model('Sessions'),
    Protos = require('mongoose').model('ProductProtos'),
    Products = require('mongoose').model('Products'),
    Orders = require('mongoose').model('Orders'),
    yandexMoney = require('./yandexMoney'),
    config  = require('./config'),
    bodyParser = require('body-parser');

//create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: true });

var useEmulator = true;// (process.env.NODE_ENV = 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector, {
    localizerSettings: {
        defaultLocale: "ru"
    }
});
var phonelem;
var orderid;
var storageid = 'N/A';
var ClientCellPhone;
var addId = null;

// Protos.add({
//     id: 'T001',
//     description: 'Индейка',
//     owner: {
//         id: 'FARM01',
//         name: 'Индеец Гусев'
//     },
//     category: 'birdmeat',
//     type: 'turkey',
//     isactive: true,
//     price: 450,
//     categories: [{
//             isactive: true,
//             id: 'big01',
//             name: 'Большая',
//             weightmax: 9,
//             weightmin: 7
//         },
//         {
//             isactive: true,
//             id: 'med02',
//             name: 'Средняя',
//             weightmax: 7,
//             weightmin: 5
//         },
//         {
//             isactive: true,
//             id: 'sma03',
//             name: 'Маленькая',
//             weightmax: 5,
//             weightmin: 3
//         }
//     ],
//     expperiod: 14,
//     picture: {
//         contentType: 'image/jpeg',
//         contentUrl: 'http://images.aif.ru/008/183/8f0224384272a0c44fa9ae9036d15ea8.jpg'
//     },
//     promt: 'Выберите размер индейки!'
// }, function (err, proto) {
//
// });
//
// Protos.add({
//     id: 'G001',
//     description: 'Гусь',
//     owner: {
//         id: 'FARM01',
//         name: 'Индеец Гусев'
//     },
//     category: 'birdmeat',
//     type: 'goose',
//     isactive: true,
//     price: 650,
//     categories: [{
//         isactive: true,
//         id: 'big01',
//         name: 'Большая',
//         weightmax: 7,
//         weightmin: 6
//     },
//         {
//             isactive: true,
//             id: 'med02',
//             name: 'Средняя',
//             weightmax: 5,
//             weightmin: 4
//         },
//         {
//             isactive: true,
//             id: 'sma03',
//             name: 'Маленькая',
//             weightmax: 3,
//             weightmin: 2
//         }
//     ],
//     expperiod: 14,
//     picture: {
//         contentType: 'image/jpeg',
//         contentUrl: 'http://www.nexplorer.ru/load/Image/1213/gus_z_5.jpg'
//     },
//     promt: 'Выберите размер гуся!'
// }, function (err, proto) {
//
// });//CREATE PROTOS

/**
 * YaMoney auth GET middleware
 */
function getAccessToken(req, res, next) {
    if (!req.query.code) return next(new Error('code expected'));
    var code = req.query.code;
    var tokenComplete = function (err, data) {
        if (err) return next (new TokenError('Error: did not get the token: ' + {err}));

        console.info('tokenComplete data: ' + JSON.stringify(data));

        var sessionId   = req.query.sessionId;
        var accessToken = data.access_token;

        // If token has not been received
        if (accessToken === undefined) return next(new TokenError('Access token is undefined.'));
        else if (sessionId === undefined) return next(new Error('Session is not defined.'));

        // restore session
        Sessions.findById(sessionId, function(err, address) {

            if (err) return next(err);

            var userId = address.user.id;
            // Save user access token to DB
            Users.setUserToken(userId, accessToken, function(err) {
                if (err) return next(new Error('Try another time.'));
                console.info('Added token for ' + {userId});
            });

            // Send success status
            res.status(200);
            res.end();

            // let msg = new builder.Message()
            //  .address(address)
            //  .text("Great! U R Autorized...");
            // bot.send(msg);

            console.info('tokenComplete address: ' + JSON.stringify(address));
            bot.beginDialog({id:address.id, user:address.user, bot:address.bot, channelId:address.channelId, conversation:address.conversation, serviceUrl:address.serviceUrl},'/yabalance');
        });
    };
    yandexMoney.getAccessToken(config.yandexAPI.clientId, code, config.yandexAPI.redirectURI, config.yandexAPI.clientSecret, tokenComplete);
}

bot.beginDialogAction('beginOrderDialog', '/order');//переход в раздел заказа(корзины)
bot.beginDialogAction('beginInfoDialog', '/info');//переход в раздел информации и боте и услуге
bot.beginDialogAction('closeOnRefuse', '/refuse');
bot.beginDialogAction('beginPaymentDialog', '/clientdata/payment');

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                var defgreet = "Меня зовут Индеец Гусев! =)! Напишите что-нибудь чтобы продолжить";
                var d = new Date;
                var dh = d.getHours();
                const defimg = new builder.Message()
                    .address(message.address)
                    .attachments([{
                        contentType: 'image/jpeg',
                        contentUrl: 'http://птицасфермы.рф/wp-content/uploads/2016/11/%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_%D0%98%D0%BD%D0%B4%D0%B5%D0%B5%D1%86-%D0%93%D1%83%D1%81%D0%B5%D0%B2_%D0%B8%D1%82%D0%BE%D0%B3.jpg'
                    }]);
                bot.send(defimg);
                if (22 >= dh && dh >= 16) {
                    const reply = new builder.Message()
                        .address(message.address)
                        .text("Добрый Вечер! " + defgreet);
                    bot.send(reply);
                } else if (16 >= dh && dh >= 12) {
                    const reply = new builder.Message()
                        .address(message.address)
                        .text("Добрый День! " + defgreet);
                    bot.send(reply);
                } else if (12 >= dh && dh >= 5) {
                    const reply = new builder.Message()
                        .address(message.address)
                        .text("Доброе Утро! " + defgreet);
                    bot.send(reply);
                } else {
                    const reply = new builder.Message()
                        .address(message.address)
                        .text("Доброй Ночи! " + defgreet);
                    bot.send(reply);
                }
            }
        });
    }
});

bot.dialog('/', [
    // function (session) {
    //     session.beginDialog('/clientdata/payment');
    // },
    function (session) {
        session.beginDialog('/client/check');
    },
    function (session) {
        var msg = new builder.Message(session).addAttachment(createStartCard(session));
        session.send(msg);
    },
    function (session) {
        session.beginDialog('/clientdata');
    },
    function (session) {
        session.endDialog();
    }
]);//CORE
bot.dialog('/client/check', [
    function (session) {
        Users.findByUserId(session.message.address.user.id, function (err) {
            if (err) {
                session.endDialogWithResult();
            } else {
                session.beginDialog('/client/history');
            }
        })
    }
]);//USER CHECK
bot.dialog('/client/history', [
    function (session) {
        session.send('ПРИВЕТ! Тут должен быть личный кабинет, пока все это дело в разработке.');
        Orders.findByClientId(session.message.address.user.id, function (err, order) {
            createOrderCard(session, order, function (err, card) {
                if (err) {
                    console.log(err);
                } else {
                    var msg = new builder.Message(session).addAttachment(card);
                    session.send(msg);
                }
            });
        })
    }
]); //USER PROFILE
bot.dialog('/order', [
    function (session) {
        session.beginDialog('/order/type');
    },
    function (session) {
        session.beginDialog('/order/comment');
    },
    function (session) {
        session.endDialogWithResult();
    }
]);//ORDER
bot.dialog('/order/type', [
    function (session) {
        Protos.findAll(function (err, protos) {
            if (!err && protos) {
                var options = [];
                session.userData.protos = [];
                for (var i = 0; i < protos.length; i++) {
                    if (protos[i].isactive) {
                        options.push(protos[i].description);
                        session.userData.protos.push(protos[i]);
                    }
                }
                builder.Prompts.choice(session, 'Какую птицу вы бы хотели заказать?.', options);
            }
        });
    },
    function (session, results) {
        session.userData.ordertype = results.response;
        session.userData.prototype = session.userData.protos[results.response.index];
        session.beginDialog('/order/size');
    }
]);//TYPE
bot.dialog('/order/size', [
   function (session) {
       var result = {};
       if (session.userData.prototype) {
           if (session.userData.prototype.categories) {
               for (var i = 0; i < session.userData.prototype.categories.length; i++) {
                   if (session.userData.prototype.categories[i].isactive) {
                       result[session.userData.prototype.categories[i].name] = session.userData.prototype.categories[i].id;
                   }
               }
           }
           builder.Prompts.choice(session, session.userData.prototype.promt, result);
       }
   },
   function (session, results) {
       session.userData.size = results.response.entity;
       session.beginDialog('/order/add');
   }
]);//SIZE
bot.dialog('/order/add', [
    function (session) {
        var prodprice;
        var wmax;
        var wmin;
        for (var i = 0; i < session.userData.prototype.categories.length; i++) {
            if (session.userData.prototype.categories[i].name == session.userData.size) {
                prodprice = (session.userData.prototype.categories[i].weightmax * session.userData.prototype.price);
                wmax = session.userData.prototype.categories[i].weightmax;
                wmin = session.userData.prototype.categories[i].weightmin;
            }
        }
        var date = new Date();
        Products.add({
            id: 'PD' + session.userData.prototype.id + date.getTime(),
            description: session.userData.prototype.description,
            owner: {
                id: session.userData.prototype.owner.id,
                name: session.userData.prototype.owner.name
            },
            orderid: orderid,
            storageid: storageid,
            clientid: session.message.address.user.id,
            category: session.userData.prototype.category,
            type: session.userData.prototype.type,
            status: {
                date: date.toLocaleString(),
                status: 'NOORDER_NEW',
            },
            price: prodprice,
            size: {
                weightmax: wmax,
                weightmin: wmin
            },
            expperiod: session.userData.prototype.expperiod,
            picture: {
                contentType: session.userData.prototype.picture.contentType,
                contentUrl: session.userData.prototype.picture.contentUrl
            }
        }, function (err, product) {

        });
        builder.Prompts.choice(session, 'Ходите еще заказать?', ['Да', 'Нет']);
    },
    function (session, results) {
        if (results.response.entity == 'Да') {
            session.beginDialog('/order/type');
        } else {
            session.endDialogWithResult();
        }
    }
]);//ADD PRODUCT TO ORDER
bot.dialog('/order/comment', [
    function (session) {
        builder.Prompts.choice(session, 'Имеются ли у вас комментарии к заказу?', ['Да', 'Нет'])
    },
    function (session, results, next) {
        if (results.response.entity == 'Да') {
            next();
        } else {
            session.endDialog();
        }
    },
    function (session) {
        builder.Prompts.text(session, 'Напишите свой комментарий и мы приккрепим его к заказу.')
    },
    function (session, results) {
        session.userData.comment = results.response;
        session.endDialogWithResult();
    }
]);//ORDER COMMENT
bot.dialog('/clientdata', [
    function (session) {
        session.beginDialog('/clientdata/phone');
    },
    function (session) {
        session.beginDialog('/order/confirmation');
    },
    function (session) {
        session.beginDialog('/clientdata/payment');
    },
    function (session) {
        session.endDialogWithResult();
    }
]);//CLIENTDATA MAIN
bot.dialog('/clientdata/phone', [
    function (session) {
        builder.Prompts.text(session, "Введите номер телефона без кода города.");
    },
    function (session, results) {
        session.userData.phone = results.response;
        phonelem = session.userData.phone.split('');
        if (phonelem.length > 10) {
            session.send("Номер слишком длинный! Введите коректный номер.");
        } else if (phonelem.length < 10) {
            session.send("Номер слишком короткий! Введите коректный номер.");
        } else {
            ClientCellPhone = phonelem[0] + phonelem[1] + phonelem[2] + "-" + phonelem[3] + phonelem[4] + phonelem[5] + phonelem[6] + phonelem[7] + phonelem[8] + phonelem[9];
            builder.Prompts.choice(session, "Проверьте номер телефона клиента: " + "+7" + ClientCellPhone, ["Верно!", "Исправить!"]);
        }
    },
    function (session, results) {
        session.userData.changephone = results.response;
        if (session.userData.changephone.entity == 'Исправить!') {
            session.beginDialog('/clientdata');
        } else {
            session.endDialogWithResult(results);
        }
    }
]);//CLIENT PHONE NUMBER
bot.dialog('/order/confirmation', [
    function (session) {
        var sum = 0;
        var date = new Date();
        function arraySum(array){
            for(var i = 0; i < array.length; i++){
                sum += array[i];
            }
        }
        Products.findAll(function (err, products) {
            if (!err && products) {
                session.userData.products = [];
                session.userData.prices = [];
                for (var i = 0; i < products.length; i++) {
                    if (products[i].clientid == session.message.address.user.id && products[i].status.status == 'NOORDER_NEW') {
                        session.userData.products.push(products[i].id);
                        session.userData.prices.push(products[i].price);
                        products[i].status = {
                            date: date.toLocaleString(),
                            status: 'INORDER_NEW'
                        };
                        products[i].save(function (err, product) {
                            if (err) {
                                console.error(err);
                            }
                            console.log('PD status updated for: ' + product.id);
                        });
                    }
                }
                arraySum(session.userData.prices);
                Orders.add({
                    id: 'ORD' + date.getTime(),
                    clientinfo: {
                        id: session.message.address.user.id,
                        phone: ClientCellPhone,
                        fio: 'N/A'
                    },
                    status: 'UNCONFIRMED_NEW',
                    date: date.toLocaleString(),
                    totalprice: sum,
                    isdeleted: '',
                    location: 'N/A',
                    products: session.userData.products,
                    comment: session.userData.comment
                }, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        session.beginDialog('/client/history');
                    }
                });
            }
        });
    }
]);
bot.dialog('/clientdata/payment', [
    function (session) {
        builder.Prompts.number(session, "Введите свой ПИН код.");
    },
    function (session, results) {
        session.userData.pin = results.response;

        // check if user already in database
        Users.authUser(session.message.address.user.id, session.userData.pin, function(err, user) {
            if(err) {
                if(err.code === 'USER_NOT_FOUND') {
                    // not found add new one
                    Users.add(session.message.address.user.id, session.userData.pin, function(err, user) {
                        if(err) {
                            session.send(err.message);
                        }
                        else {
                            session.send("New user added, need to link Yandex wallet");
                            // need to link Yandex wallet to the account
                            Sessions.add(session.message.address, function(err, sessionAddress) {
                                if(err) {
                                    session.send(err.message);
                                }
                                else {
                                    var url = yandexMoney.buildTokenUrl(sessionAddress.id);
                                    session.send(url);
                                }
                            });
                        }
                    });
                }
                else {
                    if(err.code === 'USER_NOT_AUTHENTICATED') {
                        session.send("Old user, need to re-link Yandex wallet");
                        // need to link Yandex wallet to the account
                        Sessions.add(session.message.address, function(err, sessionAddress) {
                            if(err) {
                                session.send(err.message);
                            }
                            else {
                                var url = yandexMoney.buildTokenUrl(sessionAddress.id);
                                session.send(url);
                            }
                        });
                    }
                    else {
                        session.send(err.message);
                    }
                }
            }
            else {
                session.send("Autorized");
                session.beginDialog('/yabalance');
            }
        });
    }
]);//PAYMENT MAIN
bot.dialog('/yabalance',[
    function (session) {
        builder.Prompts.choice(session, "Проверить баланс кошелька?", ['ДА', 'НЕТ']);
    },
    function (session, results) {
        if (results.response.entity == 'ДА') {
                yandexMoney.getAccountInfo(session.message.user.id, function(msg, action) {
                    session.send(msg);
                    session.beginDialog('/yap2p');
                });
        } else {
            session.beginDialog('/yap2p');
        }
    }
]);//BALANCE CHECK
bot.dialog('/yap2p',[
    function (session) {
        builder.Prompts.choice(session, "Make a Transfer?", ["yes","no"]);
    },
    function (session, results) {
        if (results.response.entity == 'yes') {
            builder.Prompts.number(session, 'Введите номер кошелька')
        } else {
            session.send("starting over...");
            session.beginDialog('/yabalance');
        }
    },
    function (session, results) {
        if (results.response) {
            var account = results.response.entity;
            var amount = 10;
            var msg = "Transfer from ReGaBot user " + session.message.user.id;
            yandexMoney.p2pPayment(session.message.user.id, account, amount, msg, function(msg, action) {
                session.send(msg);
            });
        } else {
            session.send("Ops, there is no account number, starting over");
            session.beginDialog('/');
        }
    }
]);//P2P TRANSFER
bot.dialog('/info', [
    function (session) {
        var msg = new builder.Message(session).addAttachment(createInfoCard(session));
        session.send(msg);
    }
]);//INFO
bot.dialog('/refuse', [
    function (session) {
        session.send('До свидания');
        session.endDialogWithResult();
    }
]);//REFUSE

function createStartCard(session) {
    return new builder.HeroCard(session)
        .title('У вас есть уникальная возможность заказать свежайшую индейку и гуся напрямую от фермера!')
        .images(getStartCardImages(session))
        .buttons(getStartDialogActions(session));
}
function createInfoCard(session) {
    return new builder.HeroCard(session)
        .title('Отслеживание товара на базе Blockchain и смарт-контрактов Ethereum!')
        .images(getInfoCardImages(session))
        .buttons(getInfoDialogActions(session));
}
function createOrderCard(session, order, cb) {
    Products.findAllByIds(order.products, function (err, products) {
        if (err) {
            console.log(err);
            cb(err, null);
            return;
        }
        var items = [];
        for (var i = 0; i < products.length; i++) {
            items.push(
                builder.ReceiptItem.create(session, products[i].price, products[i].description)
                    .quantity(1)
                    .image(builder.CardImage.create(session, products[i].picture.contentUrl))
            )
        }
        var card =  new builder.ReceiptCard(session)
            .title(order.clientinfo.id)
            .facts([
                builder.Fact.create(session, order.id, 'Номер Заказа:'),
            ])
            .items(items)
            .total(order.totalprice)
            .buttons([
                builder.CardAction.dialogAction(session, 'beginPaymentDialog', null, 'Оплатить'),
                builder.CardAction.dialogAction(session, 'closeOnRefuse', null, 'Отказаться!')
            ]);
        cb(null, card);
    });
}
function getStartCardImages(session) {
    return [
        builder.CardImage.create(session, 'http://www.gastronom.ru/binfiles/images/20150219/b4214445.jpg')];
}
function getInfoCardImages(session) {
    return [
        builder.CardImage.create(session, 'https://www.atraura.com/wp-content/uploads/2016/08/Ethereum.jpg')
    ];
}
function getStartDialogActions(session) {
    return [
        builder.CardAction.dialogAction(session, 'beginOrderDialog', null, 'Заказать!'),
        builder.CardAction.dialogAction(session, 'beginInfoDialog', null, 'Подробнее!')
    ];
}
function getInfoDialogActions(session) {
    return [
        builder.CardAction.dialogAction(session, 'beginOrderDialog', null, 'Заказать!'),
        builder.CardAction.dialogAction(session, 'closeOnRefuse', null, 'Отказаться!')
    ];
}
//ORDER ACTIONS
if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.use(restify.queryParser({ mapParams: false }));

    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.get('/api/yandex', getAccessToken);
    server.post('/api/messages', connector.listen());
} else {
    module.exports = { default: connector.listen() }
}