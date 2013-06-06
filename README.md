js-murmur3-128
==============

A JavaScript implementation of the 128bit variant of [Murmur3](http://en.wikipedia.org/wiki/MurmurHash).
It was written with the following constraints in mind:

1.  For the same input, it must produce a hash that is equivalent to:
    *  [C++](https://code.google.com/p/smhasher/source/browse/trunk/MurmurHash3.cpp)
    *  [Java (Guava)](http://guava-libraries.googlecode.com/git/guava/src/com/google/common/hash/Murmur3_128HashFunction.java)
2.  It must be usable in the browser


Usage
=====

The equivalent Java (Guice) and JavaScript are provided as an example:

```java
    final int seed = 0;
    final byte[] bytes = { (byte)0xDE, (byte)0xAD, (byte)0xBE, (byte)0xEF,
                           (byte)0xFE, (byte)0xED, (byte)0xFA, (byte)0xCE };
    com.google.common.hash.HashFunction hashFunction = com.google.common.hash.Hashing.murmur3_128(seed);
    com.google.common.hash.HashCode hashCode = hashFunction.newHasher()
           .putBytes(bytes)
           .hash();
    System.err.println(hashCode.asLong());
```

```javascript
    var seed = 0;
    var rawKey = new ArrayBuffer(8);
        var byteView = new Int8Array(rawKey);
            byteView[0] = 0xDE; byteView[1] = 0xAD; byteView[2] = 0xBE; byteView[3] = 0xEF;
            byteView[4] = 0xFE; byteView[5] = 0xED; byteView[6] = 0xFA; byteView[7] = 0xCE;
    console.log(murmur3.hash128(rawKey, seed));
```

Refer to the unit tests for more examples.


Other JavaScript Implementations
=================================

*  [murmurhash-js](https://github.com/garycourt/murmurhash-js) only contains
   the 32bit variant.
*  [node-murmurhash](https://github.com/perezd/node-murmurhash) is based off
   of [murmurhash-js](https://github.com/garycourt/murmurhash-js) and as a 
   result only contains the 32bit variant.
*  [murmur3](https://github.com/zmarcantel/murmur3) did not seem to match the
   Java (Guava) output. (The first 8 bytes would match but the remaining would
   not.)
*  [murmurhash3-js](https://github.com/whitequark/murmurhash3-js) only contains
   the 32bit variant.
*  [node-murmurhash3](https://github.com/hideo55/node-murmurhash3) provides both
   the 32bit and 128bit variants (through its binding to the C++ implementation)
   but cannot be used in the browser.
