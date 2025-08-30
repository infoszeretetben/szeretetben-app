# Saját jegyzetek

$ curl "https://seeme.hu/gateway?key=c2415537c8fca33feab37f0017faddf1fe5a&message=Ez%20az%20%C3%BCzenetem&number=36201234567&callback=4,6,7&format=json"

A fenti példa futtatásának hatására az "Ez az üzenetem" szövegű SMS kerül kiküldésre a 36201234567 telefonszámra, a választ JSON formátumban érkezik meg; és a 4: "Távoli SMSC fogadta", 6: "Kézbesítve", és 7: "Kézbesíthetetlen" státuszokról callback hívásban kapsz visszajelzést.

Tulajdonképpen csak a key, message, number a kötelező query.

Az SMS Gateway-hívásra az alábbi válaszokat kaphatod:

{"result":"OK","price":14,"code":0,"message":"Your message has been successfully received by the Gateway.","charset":"GSM-7","split":1,"length":5}

A seeme felületén a tudástárban le van írva még milyen key értékek vannak a hívásnál és a callback-nél is.

Ha csak kód kiküldésére használom, akkor nem kell callback, user úgyis beírja a kódot az app-ba.

–––
