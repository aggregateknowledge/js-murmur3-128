/*
 * Copyright 2013 Aggregate Knowledge, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview A JavaScript implementation of the 128bit version of MurmurHash3 
 * whose intent is to produce hashes that are binary equivalent to:
 * <ul>
 *   <li>{@link https://code.google.com/p/smhasher/source/browse/trunk/MurmurHash3.cpp}</li>
 *   <li>{@link http://guava-libraries.googlecode.com/git/guava/src/com/google/common/hash/Murmur3_128HashFunction.java}</a>
 * </ul>
 * 
 * {@link https://code.google.com/p/closure-library/source/browse/closure/goog/math/long.js goog.math.Long}
 * from {@link https://code.google.com/p/closure-library/ Closure} is required.
 * 
 * Example usage:
 * <pre>
 *     var seed = 0;
 *     var rawKey = new ArrayBuffer(1);
 *         var byteView = new Int8Array(rawKey);
 *             byteView[0] = 0xDE;
 *     var hashed = murmur3.hash128(rawKey, seed);
 *     console.log(hashed);
 * </pre>
 * 
 * {@link http://en.wikipedia.org/wiki/MurmurHash}
 */
// NOTE:  https://github.com/zmarcantel/murmur3/blob/master/murmur3.js deviated
//        from the Java Guava results so this version was written.
if(murmur3 === undefined) {
    var murmur3 = {
        version: "1.0.0"
    };
}
(function() {
  'use strict';

    // ***************************************************************************
    function rotl(number, bits) {
        return (number.shiftLeft(bits)).or(number.shiftRightUnsigned(-bits));        
    }

    // =========================================================================
    var FMIX1 = new goog.math.Long(0xED558CCD, 0xFF51AFD7), 
        FMIX2 = new goog.math.Long(0x1A85EC53, 0xC4CEB9FE);
    function fmix(number) {
        number = number.xor(number.shiftRightUnsigned(33));
        number = number.multiply(FMIX1);
        number = number.xor(number.shiftRightUnsigned(33));
        number = number.multiply(FMIX2);
        number = number.xor(number.shiftRightUnsigned(33));
        return number;
    }

    // .........................................................................
    var C1 = new goog.math.Long(0x114253D5, 0x87C37B91),
        C2 = new goog.math.Long(0x2745937F, 0x4CF5AD43);
    function mixk1(k1) {
        k1 = k1.multiply(C1);
        k1 = rotl(k1, 31);
        return k1.multiply(C2);
    }
    function mixk2(k2) {
        k2 = k2.multiply(C2);
        k2 = rotl(k2, 33);
        return k2.multiply(C1);
    }

    // *************************************************************************
    // NOTE:  the chunk (or block) size is 16 bytes (for the 128bit Murmur3)
    var CHUNK_SIZE_INTS = 4/*ints = 16bytes*/;
    var ZERO = new goog.math.Long.fromInt(0)/*for convenience*/,
        FIVE = new goog.math.Long.fromInt(5)/*for convenience*/;
    var BMIX1 = new goog.math.Long.fromInt(0x52DCE729),
        BMIX2 = new goog.math.Long.fromInt(0x38495AB5);

    // =========================================================================
    /**
     * @param  key an {@link ArrayBuffer} that is to be hashed. If not specified
     *         then a zero length buffer is used.
     * @param  seed a 32bit seed value. If not specified then 0 is used.
     * @return the first 8 bytes of the hash result as a {@link Long} (to match
     *         that of {@link http://guava-libraries.googlecode.com/git/guava/src/com/google/common/hash/Murmur3_128HashFunction.java Guava's}
     *         {@link #asLong()}).
     */
    murmur3.hash128 = function(key, seed) {
        key = key || new ArrayBuffer(0/*by contract*/)/*default*/;
        seed = seed || 0/*default*/;

        var byteBuffer = new Uint8Array(key);
        var chunkCount = byteBuffer.length >> 4/*div by CHUNK_SIZE_BYTES*/;
        var chunkCountInInts = chunkCount << 2/*4 ints per chunk*/;

        var lengthLong = new goog.math.Long.fromInt(byteBuffer.length);

        var seedLong = new goog.math.Long.fromInt(seed);
        var h1 = seedLong,
            h2 = seedLong;

        var k1, k2;

        var intBuffer = new Uint32Array(key, 0/*offset*/, chunkCountInInts/*length*/);
        for(var i=0; i<chunkCountInInts; i+=CHUNK_SIZE_INTS) {
            k1 = new goog.math.Long(intBuffer[i + 0], intBuffer[i + 1]);
            k2 = new goog.math.Long(intBuffer[i + 2], intBuffer[i + 3]);

            h1 = h1.xor(mixk1(k1));

            h1 = rotl(h1, 27);
            h1 = h1.add(h2);
            h1 = h1.multiply(FIVE).add(BMIX1);

            h2 = h2.xor(mixk2(k2));

            h2 = rotl(h2, 31);
            h2 = h2.add(h1);
            h2 = h2.multiply(FIVE).add(BMIX2);
        }

        k1 = ZERO;
        k2 = ZERO;

        var byteRemainder = byteBuffer.length & 0x0F/*mask that is CHUNK_SIZE_BYTES - 1*/;
        var remainderBuffer = new Uint8Array(key, (chunkCount << 4/*mult by CHUNK_SIZE_BYTES*/), byteRemainder)/*points to just remainder*/;
        switch(byteRemainder) { // NOTE:  all cases fall through
            // TODO:  determine if the constructor or .fromInt() is more performant
            //        (.fromInt() does a hash lookup on each call to determine
            //        if a cached version of the object already exists)
            case 15: k2 = k2.xor((new goog.math.Long.fromInt(remainderBuffer[14])).shiftLeft(48)); 
            case 14: k2 = k2.xor((new goog.math.Long.fromInt(remainderBuffer[13])).shiftLeft(40));
            case 13: k2 = k2.xor((new goog.math.Long.fromInt(remainderBuffer[12])).shiftLeft(32));
            case 12: k2 = k2.xor((new goog.math.Long.fromInt(remainderBuffer[11])).shiftLeft(24));
            case 11: k2 = k2.xor((new goog.math.Long.fromInt(remainderBuffer[10])).shiftLeft(16));
            case 10: k2 = k2.xor((new goog.math.Long.fromInt(remainderBuffer[ 9])).shiftLeft( 8));
            case  9: k2 = k2.xor( new goog.math.Long.fromInt(remainderBuffer[ 8]));
            h2 = h2.xor(mixk1(k2));
      
            case  8: k1 = k1.xor((new goog.math.Long.fromInt(remainderBuffer[ 7])).shiftLeft(56));
            case  7: k1 = k1.xor((new goog.math.Long.fromInt(remainderBuffer[ 6])).shiftLeft(48));
            case  6: k1 = k1.xor((new goog.math.Long.fromInt(remainderBuffer[ 5])).shiftLeft(40));
            case  5: k1 = k1.xor((new goog.math.Long.fromInt(remainderBuffer[ 4])).shiftLeft(32));
            case  4: k1 = k1.xor((new goog.math.Long.fromInt(remainderBuffer[ 3])).shiftLeft(24));
            case  3: k1 = k1.xor((new goog.math.Long.fromInt(remainderBuffer[ 2])).shiftLeft(16));
            case  2: k1 = k1.xor((new goog.math.Long.fromInt(remainderBuffer[ 1])).shiftLeft( 8));
            case  1: k1 = k1.xor( new goog.math.Long.fromInt(remainderBuffer[ 0]));
            h1 = h1.xor(mixk1(k1));
        }

        h1 = h1.xor(lengthLong);
        h2 = h2.xor(lengthLong);

        h1 = h1.add(h2);
        h2 = h2.add(h1);

        h1 = fmix(h1);
        h2 = fmix(h2);

        h1 = h1.add(h2);
        h2 = h2.add(h1);

        return h1/*by contract to match Guava's .asLong()*/;
    };
})();
