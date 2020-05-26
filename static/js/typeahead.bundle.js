/*!
 * typeahead.js 0.11.1
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2015 Twitter, Inc. and other contributors; Licensed MIT
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define("bloodhound", ["jquery"], function (a0) {
      return (root.Bloodhound = factory(a0));
    });
  } else if (typeof exports === "object") {
    module.exports = factory(require("jquery"));
  } else {
    root.Bloodhound = factory(jQuery);
  }
})(this, function ($) {
  var _ = (function () {
    return {
      isMsie() {
        return /(msie|trident)/i.test(navigator.userAgent)
          ? navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2]
          : false;
      },
      isBlankString(str) {
        return !str || /^\s*$/.test(str);
      },
      escapeRegExChars(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      },
      isString(obj) {
        return typeof obj === "string";
      },
      isNumber(obj) {
        return typeof obj === "number";
      },
      isArray: $.isArray,
      isFunction: $.isFunction,
      isObject: $.isPlainObject,
      isUndefined(obj) {
        return typeof obj === "undefined";
      },
      isElement(obj) {
        return !!(obj && obj.nodeType === 1);
      },
      isJQuery(obj) {
        return obj instanceof $;
      },
      toStr: function toStr(s) {
        return _.isUndefined(s) || s === null ? "" : `${s}`;
      },
      bind: $.proxy,
      each(collection, cb) {
        $.each(collection, reverseArgs);
        function reverseArgs(index, value) {
          return cb(value, index);
        }
      },
      map: $.map,
      filter: $.grep,
      every(obj, test) {
        let result = true;
        if (!obj) {
          return result;
        }
        $.each(obj, function (key, val) {
          if (!(result = test.call(null, val, key, obj))) {
            return false;
          }
        });
        return !!result;
      },
      some(obj, test) {
        let result = false;
        if (!obj) {
          return result;
        }
        $.each(obj, function (key, val) {
          if ((result = test.call(null, val, key, obj))) {
            return false;
          }
        });
        return !!result;
      },
      mixin: $.extend,
      identity(x) {
        return x;
      },
      clone(obj) {
        return $.extend(true, {}, obj);
      },
      getIdGenerator() {
        let counter = 0;
        return function () {
          return counter++;
        };
      },
      templatify: function templatify(obj) {
        return $.isFunction(obj) ? obj : template;
        function template() {
          return String(obj);
        }
      },
      defer(fn) {
        setTimeout(fn, 0);
      },
      debounce(func, wait, immediate) {
        let timeout;
        let result;
        return function () {
          const context = this;
          const args = arguments;
          let later;
          let callNow;
          later = function () {
            timeout = null;
            if (!immediate) {
              result = func.apply(context, args);
            }
          };
          callNow = immediate && !timeout;
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
          if (callNow) {
            result = func.apply(context, args);
          }
          return result;
        };
      },
      throttle(func, wait) {
        let context;
        let args;
        let timeout;
        let result;
        let previous;
        let later;
        previous = 0;
        later = function () {
          previous = new Date();
          timeout = null;
          result = func.apply(context, args);
        };
        return function () {
          const now = new Date();
          const remaining = wait - (now - previous);
          context = this;
          args = arguments;
          if (remaining <= 0) {
            clearTimeout(timeout);
            timeout = null;
            previous = now;
            result = func.apply(context, args);
          } else if (!timeout) {
            timeout = setTimeout(later, remaining);
          }
          return result;
        };
      },
      stringify(val) {
        return _.isString(val) ? val : JSON.stringify(val);
      },
      noop() {},
    };
  })();
  const VERSION = "0.11.1";
  const tokenizers = (function () {
    return {
      nonword,
      whitespace,
      obj: {
        nonword: getObjTokenizer(nonword),
        whitespace: getObjTokenizer(whitespace),
      },
    };
    function whitespace(str) {
      str = _.toStr(str);
      return str ? str.split(/\s+/) : [];
    }
    function nonword(str) {
      str = _.toStr(str);
      return str ? str.split(/\W+/) : [];
    }
    function getObjTokenizer(tokenizer) {
      return function setKey(keys) {
        keys = _.isArray(keys) ? keys : [].slice.call(arguments, 0);
        return function tokenize(o) {
          let tokens = [];
          _.each(keys, function (k) {
            tokens = tokens.concat(tokenizer(_.toStr(o[k])));
          });
          return tokens;
        };
      };
    }
  })();
  const LruCache = (function () {
    function LruCache(maxSize) {
      this.maxSize = _.isNumber(maxSize) ? maxSize : 100;
      this.reset();
      if (this.maxSize <= 0) {
        this.set = this.get = $.noop;
      }
    }
    _.mixin(LruCache.prototype, {
      set: function set(key, val) {
        const tailItem = this.list.tail;
        let node;
        if (this.size >= this.maxSize) {
          this.list.remove(tailItem);
          delete this.hash[tailItem.key];
          this.size--;
        }
        if ((node = this.hash[key])) {
          node.val = val;
          this.list.moveToFront(node);
        } else {
          node = new Node(key, val);
          this.list.add(node);
          this.hash[key] = node;
          this.size++;
        }
      },
      get: function get(key) {
        const node = this.hash[key];
        if (node) {
          this.list.moveToFront(node);
          return node.val;
        }
      },
      reset: function reset() {
        this.size = 0;
        this.hash = {};
        this.list = new List();
      },
    });
    function List() {
      this.head = this.tail = null;
    }
    _.mixin(List.prototype, {
      add: function add(node) {
        if (this.head) {
          node.next = this.head;
          this.head.prev = node;
        }
        this.head = node;
        this.tail = this.tail || node;
      },
      remove: function remove(node) {
        node.prev ? (node.prev.next = node.next) : (this.head = node.next);
        node.next ? (node.next.prev = node.prev) : (this.tail = node.prev);
      },
      moveToFront(node) {
        this.remove(node);
        this.add(node);
      },
    });
    function Node(key, val) {
      this.key = key;
      this.val = val;
      this.prev = this.next = null;
    }
    return LruCache;
  })();
  const PersistentStorage = (function () {
    let LOCAL_STORAGE;
    try {
      LOCAL_STORAGE = window.localStorage;
      LOCAL_STORAGE.setItem("~~~", "!");
      LOCAL_STORAGE.removeItem("~~~");
    } catch (err) {
      LOCAL_STORAGE = null;
    }
    function PersistentStorage(namespace, override) {
      this.prefix = ["__", namespace, "__"].join("");
      this.ttlKey = "__ttl__";
      this.keyMatcher = new RegExp(`^${_.escapeRegExChars(this.prefix)}`);
      this.ls = override || LOCAL_STORAGE;
      !this.ls && this._noop();
    }
    _.mixin(PersistentStorage.prototype, {
      _prefix(key) {
        return this.prefix + key;
      },
      _ttlKey(key) {
        return this._prefix(key) + this.ttlKey;
      },
      _noop() {
        this.get = this.set = this.remove = this.clear = this.isExpired =
          _.noop;
      },
      _safeSet(key, val) {
        try {
          this.ls.setItem(key, val);
        } catch (err) {
          if (err.name === "QuotaExceededError") {
            this.clear();
            this._noop();
          }
        }
      },
      get(key) {
        if (this.isExpired(key)) {
          this.remove(key);
        }
        return decode(this.ls.getItem(this._prefix(key)));
      },
      set(key, val, ttl) {
        if (_.isNumber(ttl)) {
          this._safeSet(this._ttlKey(key), encode(now() + ttl));
        } else {
          this.ls.removeItem(this._ttlKey(key));
        }
        return this._safeSet(this._prefix(key), encode(val));
      },
      remove(key) {
        this.ls.removeItem(this._ttlKey(key));
        this.ls.removeItem(this._prefix(key));
        return this;
      },
      clear() {
        let i;
        const keys = gatherMatchingKeys(this.keyMatcher);
        for (i = keys.length; i--; ) {
          this.remove(keys[i]);
        }
        return this;
      },
      isExpired(key) {
        const ttl = decode(this.ls.getItem(this._ttlKey(key)));
        return !!(_.isNumber(ttl) && now() > ttl);
      },
    });
    return PersistentStorage;
    function now() {
      return new Date().getTime();
    }
    function encode(val) {
      return JSON.stringify(_.isUndefined(val) ? null : val);
    }
    function decode(val) {
      return $.parseJSON(val);
    }
    function gatherMatchingKeys(keyMatcher) {
      let i;
      let key;
      const keys = [];
      const len = LOCAL_STORAGE.length;
      for (i = 0; i < len; i++) {
        if ((key = LOCAL_STORAGE.key(i)).match(keyMatcher)) {
          keys.push(key.replace(keyMatcher, ""));
        }
      }
      return keys;
    }
  })();
  const Transport = (function () {
    let pendingRequestsCount = 0;
    const pendingRequests = {};
    let maxPendingRequests = 6;
    const sharedCache = new LruCache(10);
    function Transport(o) {
      o = o || {};
      this.cancelled = false;
      this.lastReq = null;
      this._send = o.transport;
      this._get = o.limiter ? o.limiter(this._get) : this._get;
      this._cache = o.cache === false ? new LruCache(0) : sharedCache;
    }
    Transport.setMaxPendingRequests = function setMaxPendingRequests(num) {
      maxPendingRequests = num;
    };
    Transport.resetCache = function resetCache() {
      sharedCache.reset();
    };
    _.mixin(Transport.prototype, {
      _fingerprint: function fingerprint(o) {
        o = o || {};
        return o.url + o.type + $.param(o.data || {});
      },
      _get(o, cb) {
        const that = this;
        let fingerprint;
        let jqXhr;
        fingerprint = this._fingerprint(o);
        if (this.cancelled || fingerprint !== this.lastReq) {
          return;
        }
        if ((jqXhr = pendingRequests[fingerprint])) {
          jqXhr.done(done).fail(fail);
        } else if (pendingRequestsCount < maxPendingRequests) {
          pendingRequestsCount++;
          pendingRequests[fingerprint] = this._send(o)
            .done(done)
            .fail(fail)
            .always(always);
        } else {
          this.onDeckRequestArgs = [].slice.call(arguments, 0);
        }
        function done(resp) {
          cb(null, resp);
          that._cache.set(fingerprint, resp);
        }
        function fail() {
          cb(true);
        }
        function always() {
          pendingRequestsCount--;
          delete pendingRequests[fingerprint];
          if (that.onDeckRequestArgs) {
            that._get.apply(that, that.onDeckRequestArgs);
            that.onDeckRequestArgs = null;
          }
        }
      },
      get(o, cb) {
        let resp;
        let fingerprint;
        cb = cb || $.noop;
        o = _.isString(o)
          ? {
              url: o,
            }
          : o || {};
        fingerprint = this._fingerprint(o);
        this.cancelled = false;
        this.lastReq = fingerprint;
        if ((resp = this._cache.get(fingerprint))) {
          cb(null, resp);
        } else {
          this._get(o, cb);
        }
      },
      cancel() {
        this.cancelled = true;
      },
    });
    return Transport;
  })();
  const SearchIndex = (window.SearchIndex = (function () {
    const CHILDREN = "c";
    const IDS = "i";
    function SearchIndex(o) {
      o = o || {};
      if (!o.datumTokenizer || !o.queryTokenizer) {
        $.error("datumTokenizer and queryTokenizer are both required");
      }
      this.identify = o.identify || _.stringify;
      this.datumTokenizer = o.datumTokenizer;
      this.queryTokenizer = o.queryTokenizer;
      this.reset();
    }
    _.mixin(SearchIndex.prototype, {
      bootstrap: function bootstrap(o) {
        this.datums = o.datums;
        this.trie = o.trie;
      },
      add(data) {
        const that = this;
        data = _.isArray(data) ? data : [data];
        _.each(data, function (datum) {
          let id;
          let tokens;
          that.datums[(id = that.identify(datum))] = datum;
          tokens = normalizeTokens(that.datumTokenizer(datum));
          _.each(tokens, function (token) {
            let node;
            let chars;
            let ch;
            node = that.trie;
            chars = token.split("");
            while ((ch = chars.shift())) {
              node = node[CHILDREN][ch] || (node[CHILDREN][ch] = newNode());
              node[IDS].push(id);
            }
          });
        });
      },
      get: function get(ids) {
        const that = this;
        return _.map(ids, function (id) {
          return that.datums[id];
        });
      },
      search: function search(query) {
        const that = this;
        let tokens;
        let matches;
        tokens = normalizeTokens(this.queryTokenizer(query));
        _.each(tokens, function (token) {
          let node;
          let chars;
          let ch;
          let ids;
          if (matches && matches.length === 0) {
            return false;
          }
          node = that.trie;
          chars = token.split("");
          while (node && (ch = chars.shift())) {
            node = node[CHILDREN][ch];
          }
          if (node && chars.length === 0) {
            ids = node[IDS].slice(0);
            matches = matches ? getIntersection(matches, ids) : ids;
          } else {
            matches = [];
            return false;
          }
        });
        return matches
          ? _.map(unique(matches), function (id) {
              return that.datums[id];
            })
          : [];
      },
      all: function all() {
        const values = [];
        for (const key in this.datums) {
          values.push(this.datums[key]);
        }
        return values;
      },
      reset: function reset() {
        this.datums = {};
        this.trie = newNode();
      },
      serialize: function serialize() {
        return {
          datums: this.datums,
          trie: this.trie,
        };
      },
    });
    return SearchIndex;
    function normalizeTokens(tokens) {
      tokens = _.filter(tokens, function (token) {
        return !!token;
      });
      tokens = _.map(tokens, function (token) {
        return token.toLowerCase();
      });
      return tokens;
    }
    function newNode() {
      const node = {};
      node[IDS] = [];
      node[CHILDREN] = {};
      return node;
    }
    function unique(array) {
      const seen = {};
      const uniques = [];
      for (let i = 0, len = array.length; i < len; i++) {
        if (!seen[array[i]]) {
          seen[array[i]] = true;
          uniques.push(array[i]);
        }
      }
      return uniques;
    }
    function getIntersection(arrayA, arrayB) {
      let ai = 0;
      let bi = 0;
      const intersection = [];
      arrayA = arrayA.sort();
      arrayB = arrayB.sort();
      const lenArrayA = arrayA.length;
      const lenArrayB = arrayB.length;
      while (ai < lenArrayA && bi < lenArrayB) {
        if (arrayA[ai] < arrayB[bi]) {
          ai++;
        } else if (arrayA[ai] > arrayB[bi]) {
          bi++;
        } else {
          intersection.push(arrayA[ai]);
          ai++;
          bi++;
        }
      }
      return intersection;
    }
  })());
  const Prefetch = (function () {
    let keys;
    keys = {
      data: "data",
      protocol: "protocol",
      thumbprint: "thumbprint",
    };
    function Prefetch(o) {
      this.url = o.url;
      this.ttl = o.ttl;
      this.cache = o.cache;
      this.prepare = o.prepare;
      this.transform = o.transform;
      this.transport = o.transport;
      this.thumbprint = o.thumbprint;
      this.storage = new PersistentStorage(o.cacheKey);
    }
    _.mixin(Prefetch.prototype, {
      _settings: function settings() {
        return {
          url: this.url,
          type: "GET",
          dataType: "json",
        };
      },
      store: function store(data) {
        if (!this.cache) {
          return;
        }
        this.storage.set(keys.data, data, this.ttl);
        this.storage.set(keys.protocol, location.protocol, this.ttl);
        this.storage.set(keys.thumbprint, this.thumbprint, this.ttl);
      },
      fromCache: function fromCache() {
        const stored = {};
        let isExpired;
        if (!this.cache) {
          return null;
        }
        stored.data = this.storage.get(keys.data);
        stored.protocol = this.storage.get(keys.protocol);
        stored.thumbprint = this.storage.get(keys.thumbprint);
        isExpired =
          stored.thumbprint !== this.thumbprint ||
          stored.protocol !== location.protocol;
        return stored.data && !isExpired ? stored.data : null;
      },
      fromNetwork(cb) {
        const that = this;
        let settings;
        if (!cb) {
          return;
        }
        settings = this.prepare(this._settings());
        this.transport(settings).fail(onError).done(onResponse);
        function onError() {
          cb(true);
        }
        function onResponse(resp) {
          cb(null, that.transform(resp));
        }
      },
      clear: function clear() {
        this.storage.clear();
        return this;
      },
    });
    return Prefetch;
  })();
  const Remote = (function () {
    function Remote(o) {
      this.url = o.url;
      this.prepare = o.prepare;
      this.transform = o.transform;
      this.transport = new Transport({
        cache: o.cache,
        limiter: o.limiter,
        transport: o.transport,
      });
    }
    _.mixin(Remote.prototype, {
      _settings: function settings() {
        return {
          url: this.url,
          type: "GET",
          dataType: "json",
        };
      },
      get: function get(query, cb) {
        const that = this;
        let settings;
        if (!cb) {
          return;
        }
        query = query || "";
        settings = this.prepare(query, this._settings());
        return this.transport.get(settings, onResponse);
        function onResponse(err, resp) {
          err ? cb([]) : cb(that.transform(resp));
        }
      },
      cancelLastRequest: function cancelLastRequest() {
        this.transport.cancel();
      },
    });
    return Remote;
  })();
  const oParser = (function () {
    return function parse(o) {
      let defaults;
      let sorter;
      defaults = {
        initialize: true,
        identify: _.stringify,
        datumTokenizer: null,
        queryTokenizer: null,
        sufficient: 5,
        sorter: null,
        local: [],
        prefetch: null,
        remote: null,
      };
      o = _.mixin(defaults, o || {});
      !o.datumTokenizer && $.error("datumTokenizer is required");
      !o.queryTokenizer && $.error("queryTokenizer is required");
      sorter = o.sorter;
      o.sorter = sorter
        ? function (x) {
            return x.sort(sorter);
          }
        : _.identity;
      o.local = _.isFunction(o.local) ? o.local() : o.local;
      o.prefetch = parsePrefetch(o.prefetch);
      o.remote = parseRemote(o.remote);
      return o;
    };
    function parsePrefetch(o) {
      let defaults;
      if (!o) {
        return null;
      }
      defaults = {
        url: null,
        ttl: 24 * 60 * 60 * 1e3,
        cache: true,
        cacheKey: null,
        thumbprint: "",
        prepare: _.identity,
        transform: _.identity,
        transport: null,
      };
      o = _.isString(o)
        ? {
            url: o,
          }
        : o;
      o = _.mixin(defaults, o);
      !o.url && $.error("prefetch requires url to be set");
      o.transform = o.filter || o.transform;
      o.cacheKey = o.cacheKey || o.url;
      o.thumbprint = VERSION + o.thumbprint;
      o.transport = o.transport ? callbackToDeferred(o.transport) : $.ajax;
      return o;
    }
    function parseRemote(o) {
      let defaults;
      if (!o) {
        return;
      }
      defaults = {
        url: null,
        cache: true,
        prepare: null,
        replace: null,
        wildcard: null,
        limiter: null,
        rateLimitBy: "debounce",
        rateLimitWait: 300,
        transform: _.identity,
        transport: null,
      };
      o = _.isString(o)
        ? {
            url: o,
          }
        : o;
      o = _.mixin(defaults, o);
      !o.url && $.error("remote requires url to be set");
      o.transform = o.filter || o.transform;
      o.prepare = toRemotePrepare(o);
      o.limiter = toLimiter(o);
      o.transport = o.transport ? callbackToDeferred(o.transport) : $.ajax;
      delete o.replace;
      delete o.wildcard;
      delete o.rateLimitBy;
      delete o.rateLimitWait;
      return o;
    }
    function toRemotePrepare(o) {
      let prepare;
      let replace;
      let wildcard;
      prepare = o.prepare;
      replace = o.replace;
      wildcard = o.wildcard;
      if (prepare) {
        return prepare;
      }
      if (replace) {
        prepare = prepareByReplace;
      } else if (o.wildcard) {
        prepare = prepareByWildcard;
      } else {
        prepare = idenityPrepare;
      }
      return prepare;
      function prepareByReplace(query, settings) {
        settings.url = replace(settings.url, query);
        return settings;
      }
      function prepareByWildcard(query, settings) {
        settings.url = settings.url.replace(
          wildcard,
          encodeURIComponent(query)
        );
        return settings;
      }
      function idenityPrepare(query, settings) {
        return settings;
      }
    }
    function toLimiter(o) {
      let limiter;
      let method;
      let wait;
      limiter = o.limiter;
      method = o.rateLimitBy;
      wait = o.rateLimitWait;
      if (!limiter) {
        limiter = /^throttle$/i.test(method) ? throttle(wait) : debounce(wait);
      }
      return limiter;
      function debounce(wait) {
        return function debounce(fn) {
          return _.debounce(fn, wait);
        };
      }
      function throttle(wait) {
        return function throttle(fn) {
          return _.throttle(fn, wait);
        };
      }
    }
    function callbackToDeferred(fn) {
      return function wrapper(o) {
        const deferred = $.Deferred();
        fn(o, onSuccess, onError);
        return deferred;
        function onSuccess(resp) {
          _.defer(function () {
            deferred.resolve(resp);
          });
        }
        function onError(err) {
          _.defer(function () {
            deferred.reject(err);
          });
        }
      };
    }
  })();
  const Bloodhound = (function () {
    let old;
    old = window && window.Bloodhound;
    function Bloodhound(o) {
      o = oParser(o);
      this.sorter = o.sorter;
      this.identify = o.identify;
      this.sufficient = o.sufficient;
      this.local = o.local;
      this.remote = o.remote ? new Remote(o.remote) : null;
      this.prefetch = o.prefetch ? new Prefetch(o.prefetch) : null;
      this.index = new SearchIndex({
        identify: this.identify,
        datumTokenizer: o.datumTokenizer,
        queryTokenizer: o.queryTokenizer,
      });
      o.initialize !== false && this.initialize();
    }
    Bloodhound.noConflict = function noConflict() {
      window && (window.Bloodhound = old);
      return Bloodhound;
    };
    Bloodhound.tokenizers = tokenizers;
    _.mixin(Bloodhound.prototype, {
      __ttAdapter: function ttAdapter() {
        const that = this;
        return this.remote ? withAsync : withoutAsync;
        function withAsync(query, sync, async) {
          return that.search(query, sync, async);
        }
        function withoutAsync(query, sync) {
          return that.search(query, sync);
        }
      },
      _loadPrefetch: function loadPrefetch() {
        const that = this;
        let deferred;
        let serialized;
        deferred = $.Deferred();
        if (!this.prefetch) {
          deferred.resolve();
        } else if ((serialized = this.prefetch.fromCache())) {
          this.index.bootstrap(serialized);
          deferred.resolve();
        } else {
          this.prefetch.fromNetwork(done);
        }
        return deferred.promise();
        function done(err, data) {
          if (err) {
            return deferred.reject();
          }
          that.add(data);
          that.prefetch.store(that.index.serialize());
          deferred.resolve();
        }
      },
      _initialize: function initialize() {
        const that = this;
        let deferred;
        this.clear();
        (this.initPromise = this._loadPrefetch()).done(addLocalToIndex);
        return this.initPromise;
        function addLocalToIndex() {
          that.add(that.local);
        }
      },
      initialize: function initialize(force) {
        return !this.initPromise || force
          ? this._initialize()
          : this.initPromise;
      },
      add: function add(data) {
        this.index.add(data);
        return this;
      },
      get: function get(ids) {
        ids = _.isArray(ids) ? ids : [].slice.call(arguments);
        return this.index.get(ids);
      },
      search: function search(query, sync, async) {
        const that = this;
        let local;
        local = this.sorter(this.index.search(query));
        sync(this.remote ? local.slice() : local);
        if (this.remote && local.length < this.sufficient) {
          this.remote.get(query, processRemote);
        } else if (this.remote) {
          this.remote.cancelLastRequest();
        }
        return this;
        function processRemote(remote) {
          const nonDuplicates = [];
          _.each(remote, function (r) {
            !_.some(local, function (l) {
              return that.identify(r) === that.identify(l);
            }) && nonDuplicates.push(r);
          });
          async && async(nonDuplicates);
        }
      },
      all: function all() {
        return this.index.all();
      },
      clear: function clear() {
        this.index.reset();
        return this;
      },
      clearPrefetchCache: function clearPrefetchCache() {
        this.prefetch && this.prefetch.clear();
        return this;
      },
      clearRemoteCache: function clearRemoteCache() {
        Transport.resetCache();
        return this;
      },
      ttAdapter: function ttAdapter() {
        return this.__ttAdapter();
      },
    });
    return Bloodhound;
  })();
  return Bloodhound;
});

(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define("typeahead.js", ["jquery"], function (a0) {
      return factory(a0);
    });
  } else if (typeof exports === "object") {
    module.exports = factory(require("jquery"));
  } else {
    factory(jQuery);
  }
})(this, function ($) {
  var _ = (function () {
    return {
      isMsie() {
        return /(msie|trident)/i.test(navigator.userAgent)
          ? navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2]
          : false;
      },
      isBlankString(str) {
        return !str || /^\s*$/.test(str);
      },
      escapeRegExChars(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      },
      isString(obj) {
        return typeof obj === "string";
      },
      isNumber(obj) {
        return typeof obj === "number";
      },
      isArray: $.isArray,
      isFunction: $.isFunction,
      isObject: $.isPlainObject,
      isUndefined(obj) {
        return typeof obj === "undefined";
      },
      isElement(obj) {
        return !!(obj && obj.nodeType === 1);
      },
      isJQuery(obj) {
        return obj instanceof $;
      },
      toStr: function toStr(s) {
        return _.isUndefined(s) || s === null ? "" : `${s}`;
      },
      bind: $.proxy,
      each(collection, cb) {
        $.each(collection, reverseArgs);
        function reverseArgs(index, value) {
          return cb(value, index);
        }
      },
      map: $.map,
      filter: $.grep,
      every(obj, test) {
        let result = true;
        if (!obj) {
          return result;
        }
        $.each(obj, function (key, val) {
          if (!(result = test.call(null, val, key, obj))) {
            return false;
          }
        });
        return !!result;
      },
      some(obj, test) {
        let result = false;
        if (!obj) {
          return result;
        }
        $.each(obj, function (key, val) {
          if ((result = test.call(null, val, key, obj))) {
            return false;
          }
        });
        return !!result;
      },
      mixin: $.extend,
      identity(x) {
        return x;
      },
      clone(obj) {
        return $.extend(true, {}, obj);
      },
      getIdGenerator() {
        let counter = 0;
        return function () {
          return counter++;
        };
      },
      templatify: function templatify(obj) {
        return $.isFunction(obj) ? obj : template;
        function template() {
          return String(obj);
        }
      },
      defer(fn) {
        setTimeout(fn, 0);
      },
      debounce(func, wait, immediate) {
        let timeout;
        let result;
        return function () {
          const context = this;
          const args = arguments;
          let later;
          let callNow;
          later = function () {
            timeout = null;
            if (!immediate) {
              result = func.apply(context, args);
            }
          };
          callNow = immediate && !timeout;
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
          if (callNow) {
            result = func.apply(context, args);
          }
          return result;
        };
      },
      throttle(func, wait) {
        let context;
        let args;
        let timeout;
        let result;
        let previous;
        let later;
        previous = 0;
        later = function () {
          previous = new Date();
          timeout = null;
          result = func.apply(context, args);
        };
        return function () {
          const now = new Date();
          const remaining = wait - (now - previous);
          context = this;
          args = arguments;
          if (remaining <= 0) {
            clearTimeout(timeout);
            timeout = null;
            previous = now;
            result = func.apply(context, args);
          } else if (!timeout) {
            timeout = setTimeout(later, remaining);
          }
          return result;
        };
      },
      stringify(val) {
        return _.isString(val) ? val : JSON.stringify(val);
      },
      noop() {},
    };
  })();
  const WWW = (function () {
    const defaultClassNames = {
      wrapper: "twitter-typeahead",
      input: "tt-input",
      hint: "tt-hint",
      menu: "tt-menu",
      dataset: "tt-dataset",
      suggestion: "tt-suggestion",
      selectable: "tt-selectable",
      empty: "tt-empty",
      open: "tt-open",
      cursor: "tt-cursor",
      highlight: "tt-highlight",
    };
    return build;
    function build(o) {
      let www;
      let classes;
      classes = _.mixin({}, defaultClassNames, o);
      www = {
        css: buildCss(),
        classes,
        html: buildHtml(classes),
        selectors: buildSelectors(classes),
      };
      return {
        css: www.css,
        html: www.html,
        classes: www.classes,
        selectors: www.selectors,
        mixin(o) {
          _.mixin(o, www);
        },
      };
    }
    function buildHtml(c) {
      return {
        wrapper: `<span class="${c.wrapper}"></span>`,
        menu: `<div class="${c.menu}"></div>`,
      };
    }
    function buildSelectors(classes) {
      const selectors = {};
      _.each(classes, function (v, k) {
        selectors[k] = `.${v}`;
      });
      return selectors;
    }
    function buildCss() {
      const css = {
        wrapper: {
          position: "relative",
          display: "inline-block",
        },
        hint: {
          position: "absolute",
          top: "0",
          left: "0",
          borderColor: "transparent",
          boxShadow: "none",
          opacity: "1",
        },
        input: {
          position: "relative",
          verticalAlign: "top",
          backgroundColor: "transparent",
        },
        inputWithNoHint: {
          position: "relative",
          verticalAlign: "top",
        },
        menu: {
          position: "absolute",
          top: "100%",
          left: "0",
          zIndex: "100",
          display: "none",
        },
        ltr: {
          left: "0",
          right: "auto",
        },
        rtl: {
          left: "auto",
          right: " 0",
        },
      };
      if (_.isMsie()) {
        _.mixin(css.input, {
          backgroundImage:
            "url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)",
        });
      }
      return css;
    }
  })();
  const EventBus = (function () {
    let namespace;
    let deprecationMap;
    namespace = "typeahead:";
    deprecationMap = {
      render: "rendered",
      cursorchange: "cursorchanged",
      select: "selected",
      autocomplete: "autocompleted",
    };
    function EventBus(o) {
      if (!o || !o.el) {
        $.error("EventBus initialized without el");
      }
      this.$el = $(o.el);
    }
    _.mixin(EventBus.prototype, {
      _trigger(type, args) {
        let $e;
        $e = $.Event(namespace + type);
        (args = args || []).unshift($e);
        this.$el.trigger.apply(this.$el, args);
        return $e;
      },
      before(type) {
        let args;
        let $e;
        args = [].slice.call(arguments, 1);
        $e = this._trigger(`before${type}`, args);
        return $e.isDefaultPrevented();
      },
      trigger(type) {
        let deprecatedType;
        this._trigger(type, [].slice.call(arguments, 1));
        if ((deprecatedType = deprecationMap[type])) {
          this._trigger(deprecatedType, [].slice.call(arguments, 1));
        }
      },
    });
    return EventBus;
  })();
  const EventEmitter = (function () {
    const splitter = /\s+/;
    const nextTick = getNextTick();
    return {
      onSync,
      onAsync,
      off,
      trigger,
    };
    function on(method, types, cb, context) {
      let type;
      if (!cb) {
        return this;
      }
      types = types.split(splitter);
      cb = context ? bindContext(cb, context) : cb;
      this._callbacks = this._callbacks || {};
      while ((type = types.shift())) {
        this._callbacks[type] = this._callbacks[type] || {
          sync: [],
          async: [],
        };
        this._callbacks[type][method].push(cb);
      }
      return this;
    }
    function onAsync(types, cb, context) {
      return on.call(this, "async", types, cb, context);
    }
    function onSync(types, cb, context) {
      return on.call(this, "sync", types, cb, context);
    }
    function off(types) {
      let type;
      if (!this._callbacks) {
        return this;
      }
      types = types.split(splitter);
      while ((type = types.shift())) {
        delete this._callbacks[type];
      }
      return this;
    }
    function trigger(types) {
      let type;
      let callbacks;
      let args;
      let syncFlush;
      let asyncFlush;
      if (!this._callbacks) {
        return this;
      }
      types = types.split(splitter);
      args = [].slice.call(arguments, 1);
      while ((type = types.shift()) && (callbacks = this._callbacks[type])) {
        syncFlush = getFlush(callbacks.sync, this, [type].concat(args));
        asyncFlush = getFlush(callbacks.async, this, [type].concat(args));
        syncFlush() && nextTick(asyncFlush);
      }
      return this;
    }
    function getFlush(callbacks, context, args) {
      return flush;
      function flush() {
        let cancelled;
        for (let i = 0, len = callbacks.length; !cancelled && i < len; i += 1) {
          cancelled = callbacks[i].apply(context, args) === false;
        }
        return !cancelled;
      }
    }
    function getNextTick() {
      let nextTickFn;
      if (window.setImmediate) {
        nextTickFn = function nextTickSetImmediate(fn) {
          setImmediate(function () {
            fn();
          });
        };
      } else {
        nextTickFn = function nextTickSetTimeout(fn) {
          setTimeout(function () {
            fn();
          }, 0);
        };
      }
      return nextTickFn;
    }
    function bindContext(fn, context) {
      return fn.bind
        ? fn.bind(context)
        : function () {
            fn.apply(context, [].slice.call(arguments, 0));
          };
    }
  })();
  const highlight = (function (doc) {
    const defaults = {
      node: null,
      pattern: null,
      tagName: "strong",
      className: null,
      wordsOnly: false,
      caseSensitive: false,
    };
    return function hightlight(o) {
      let regex;
      o = _.mixin({}, defaults, o);
      if (!o.node || !o.pattern) {
        return;
      }
      o.pattern = _.isArray(o.pattern) ? o.pattern : [o.pattern];
      regex = getRegex(o.pattern, o.caseSensitive, o.wordsOnly);
      traverse(o.node, hightlightTextNode);
      function hightlightTextNode(textNode) {
        let match;
        let patternNode;
        let wrapperNode;
        if ((match = regex.exec(textNode.data))) {
          wrapperNode = doc.createElement(o.tagName);
          o.className && (wrapperNode.className = o.className);
          patternNode = textNode.splitText(match.index);
          patternNode.splitText(match[0].length);
          wrapperNode.appendChild(patternNode.cloneNode(true));
          textNode.parentNode.replaceChild(wrapperNode, patternNode);
        }
        return !!match;
      }
      function traverse(el, hightlightTextNode) {
        let childNode;
        const TEXT_NODE_TYPE = 3;
        for (let i = 0; i < el.childNodes.length; i++) {
          childNode = el.childNodes[i];
          if (childNode.nodeType === TEXT_NODE_TYPE) {
            i += hightlightTextNode(childNode) ? 1 : 0;
          } else {
            traverse(childNode, hightlightTextNode);
          }
        }
      }
    };
    function getRegex(patterns, caseSensitive, wordsOnly) {
      const escapedPatterns = [];
      let regexStr;
      for (let i = 0, len = patterns.length; i < len; i++) {
        escapedPatterns.push(_.escapeRegExChars(patterns[i]));
      }
      regexStr = wordsOnly
        ? `\\b(${escapedPatterns.join("|")})\\b`
        : `(${escapedPatterns.join("|")})`;
      return caseSensitive ? new RegExp(regexStr) : new RegExp(regexStr, "i");
    }
  })(window.document);
  const Input = (function () {
    let specialKeyCodeMap;
    specialKeyCodeMap = {
      9: "tab",
      27: "esc",
      37: "left",
      39: "right",
      13: "enter",
      38: "up",
      40: "down",
    };
    function Input(o, www) {
      o = o || {};
      if (!o.input) {
        $.error("input is missing");
      }
      www.mixin(this);
      this.$hint = $(o.hint);
      this.$input = $(o.input);
      this.query = this.$input.val();
      this.queryWhenFocused = this.hasFocus() ? this.query : null;
      this.$overflowHelper = buildOverflowHelper(this.$input);
      this._checkLanguageDirection();
      if (this.$hint.length === 0) {
        this.setHint = this.getHint = this.clearHint = this.clearHintIfInvalid =
          _.noop;
      }
    }
    Input.normalizeQuery = function (str) {
      return _.toStr(str)
        .replace(/^\s*/g, "")
        .replace(/\s{2,}/g, " ");
    };
    _.mixin(Input.prototype, EventEmitter, {
      _onBlur: function onBlur() {
        this.resetInputValue();
        this.trigger("blurred");
      },
      _onFocus: function onFocus() {
        this.queryWhenFocused = this.query;
        this.trigger("focused");
      },
      _onKeydown: function onKeydown($e) {
        const keyName = specialKeyCodeMap[$e.which || $e.keyCode];
        this._managePreventDefault(keyName, $e);
        if (keyName && this._shouldTrigger(keyName, $e)) {
          this.trigger(`${keyName}Keyed`, $e);
        }
      },
      _onInput: function onInput() {
        this._setQuery(this.getInputValue());
        this.clearHintIfInvalid();
        this._checkLanguageDirection();
      },
      _managePreventDefault: function managePreventDefault(keyName, $e) {
        let preventDefault;
        switch (keyName) {
          case "up":
          case "down":
            preventDefault = !withModifier($e);
            break;

          default:
            preventDefault = false;
        }
        preventDefault && $e.preventDefault();
      },
      _shouldTrigger: function shouldTrigger(keyName, $e) {
        let trigger;
        switch (keyName) {
          case "tab":
            trigger = !withModifier($e);
            break;

          default:
            trigger = true;
        }
        return trigger;
      },
      _checkLanguageDirection: function checkLanguageDirection() {
        const dir = (this.$input.css("direction") || "ltr").toLowerCase();
        if (this.dir !== dir) {
          this.dir = dir;
          this.$hint.attr("dir", dir);
          this.trigger("langDirChanged", dir);
        }
      },
      _setQuery: function setQuery(val, silent) {
        let areEquivalent;
        let hasDifferentWhitespace;
        areEquivalent = areQueriesEquivalent(val, this.query);
        hasDifferentWhitespace = areEquivalent
          ? this.query.length !== val.length
          : false;
        this.query = val;
        if (!silent && !areEquivalent) {
          this.trigger("queryChanged", this.query);
        } else if (!silent && hasDifferentWhitespace) {
          this.trigger("whitespaceChanged", this.query);
        }
      },
      bind() {
        const that = this;
        let onBlur;
        let onFocus;
        let onKeydown;
        let onInput;
        onBlur = _.bind(this._onBlur, this);
        onFocus = _.bind(this._onFocus, this);
        onKeydown = _.bind(this._onKeydown, this);
        onInput = _.bind(this._onInput, this);
        this.$input
          .on("blur.tt", onBlur)
          .on("focus.tt", onFocus)
          .on("keydown.tt", onKeydown);
        if (!_.isMsie() || _.isMsie() > 9) {
          this.$input.on("input.tt", onInput);
        } else {
          this.$input.on("keydown.tt keypress.tt cut.tt paste.tt", function (
            $e
          ) {
            if (specialKeyCodeMap[$e.which || $e.keyCode]) {
              return;
            }
            _.defer(_.bind(that._onInput, that, $e));
          });
        }
        return this;
      },
      focus: function focus() {
        this.$input.focus();
      },
      blur: function blur() {
        this.$input.blur();
      },
      getLangDir: function getLangDir() {
        return this.dir;
      },
      getQuery: function getQuery() {
        return this.query || "";
      },
      setQuery: function setQuery(val, silent) {
        this.setInputValue(val);
        this._setQuery(val, silent);
      },
      hasQueryChangedSinceLastFocus: function hasQueryChangedSinceLastFocus() {
        return this.query !== this.queryWhenFocused;
      },
      getInputValue: function getInputValue() {
        return this.$input.val();
      },
      setInputValue: function setInputValue(value) {
        this.$input.val(value);
        this.clearHintIfInvalid();
        this._checkLanguageDirection();
      },
      resetInputValue: function resetInputValue() {
        this.setInputValue(this.query);
      },
      getHint: function getHint() {
        return this.$hint.val();
      },
      setHint: function setHint(value) {
        this.$hint.val(value);
      },
      clearHint: function clearHint() {
        this.setHint("");
      },
      clearHintIfInvalid: function clearHintIfInvalid() {
        let val;
        let hint;
        let valIsPrefixOfHint;
        let isValid;
        val = this.getInputValue();
        hint = this.getHint();
        valIsPrefixOfHint = val !== hint && hint.indexOf(val) === 0;
        isValid = val !== "" && valIsPrefixOfHint && !this.hasOverflow();
        !isValid && this.clearHint();
      },
      hasFocus: function hasFocus() {
        return this.$input.is(":focus");
      },
      hasOverflow: function hasOverflow() {
        const constraint = this.$input.width() - 2;
        this.$overflowHelper.text(this.getInputValue());
        return this.$overflowHelper.width() >= constraint;
      },
      isCursorAtEnd() {
        let valueLength;
        let selectionStart;
        let range;
        valueLength = this.$input.val().length;
        selectionStart = this.$input[0].selectionStart;
        if (_.isNumber(selectionStart)) {
          return selectionStart === valueLength;
        }
        if (document.selection) {
          range = document.selection.createRange();
          range.moveStart("character", -valueLength);
          return valueLength === range.text.length;
        }
        return true;
      },
      destroy: function destroy() {
        this.$hint.off(".tt");
        this.$input.off(".tt");
        this.$overflowHelper.remove();
        this.$hint = this.$input = this.$overflowHelper = $("<div>");
      },
    });
    return Input;
    function buildOverflowHelper($input) {
      return $('<pre aria-hidden="true"></pre>')
        .css({
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "pre",
          fontFamily: $input.css("font-family"),
          fontSize: $input.css("font-size"),
          fontStyle: $input.css("font-style"),
          fontVariant: $input.css("font-variant"),
          fontWeight: $input.css("font-weight"),
          wordSpacing: $input.css("word-spacing"),
          letterSpacing: $input.css("letter-spacing"),
          textIndent: $input.css("text-indent"),
          textRendering: $input.css("text-rendering"),
          textTransform: $input.css("text-transform"),
        })
        .insertAfter($input);
    }
    function areQueriesEquivalent(a, b) {
      return Input.normalizeQuery(a) === Input.normalizeQuery(b);
    }
    function withModifier($e) {
      return $e.altKey || $e.ctrlKey || $e.metaKey || $e.shiftKey;
    }
  })();
  const Dataset = (function () {
    let keys;
    let nameGenerator;
    keys = {
      val: "tt-selectable-display",
      obj: "tt-selectable-object",
    };
    nameGenerator = _.getIdGenerator();
    function Dataset(o, www) {
      o = o || {};
      o.templates = o.templates || {};
      o.templates.notFound = o.templates.notFound || o.templates.empty;
      if (!o.source) {
        $.error("missing source");
      }
      if (!o.node) {
        $.error("missing node");
      }
      if (o.name && !isValidName(o.name)) {
        $.error(`invalid dataset name: ${o.name}`);
      }
      www.mixin(this);
      this.highlight = !!o.highlight;
      this.name = o.name || nameGenerator();
      this.limit = o.limit || 5;
      this.displayFn = getDisplayFn(o.display || o.displayKey);
      this.templates = getTemplates(o.templates, this.displayFn);
      this.source = o.source.__ttAdapter ? o.source.__ttAdapter() : o.source;
      this.async = _.isUndefined(o.async) ? this.source.length > 2 : !!o.async;
      this._resetLastSuggestion();
      this.$el = $(o.node)
        .addClass(this.classes.dataset)
        .addClass(`${this.classes.dataset}-${this.name}`);
    }
    Dataset.extractData = function extractData(el) {
      const $el = $(el);
      if ($el.data(keys.obj)) {
        return {
          val: $el.data(keys.val) || "",
          obj: $el.data(keys.obj) || null,
        };
      }
      return null;
    };
    _.mixin(Dataset.prototype, EventEmitter, {
      _overwrite: function overwrite(query, suggestions) {
        suggestions = suggestions || [];
        if (suggestions.length) {
          this._renderSuggestions(query, suggestions);
        } else if (this.async && this.templates.pending) {
          this._renderPending(query);
        } else if (!this.async && this.templates.notFound) {
          this._renderNotFound(query);
        } else {
          this._empty();
        }
        this.trigger("rendered", this.name, suggestions, false);
      },
      _append: function append(query, suggestions) {
        suggestions = suggestions || [];
        if (suggestions.length && this.$lastSuggestion.length) {
          this._appendSuggestions(query, suggestions);
        } else if (suggestions.length) {
          this._renderSuggestions(query, suggestions);
        } else if (!this.$lastSuggestion.length && this.templates.notFound) {
          this._renderNotFound(query);
        }
        this.trigger("rendered", this.name, suggestions, true);
      },
      _renderSuggestions: function renderSuggestions(query, suggestions) {
        let $fragment;
        $fragment = this._getSuggestionsFragment(query, suggestions);
        this.$lastSuggestion = $fragment.children().last();
        this.$el
          .html($fragment)
          .prepend(this._getHeader(query, suggestions))
          .append(this._getFooter(query, suggestions));
      },
      _appendSuggestions: function appendSuggestions(query, suggestions) {
        let $fragment;
        let $lastSuggestion;
        $fragment = this._getSuggestionsFragment(query, suggestions);
        $lastSuggestion = $fragment.children().last();
        this.$lastSuggestion.after($fragment);
        this.$lastSuggestion = $lastSuggestion;
      },
      _renderPending: function renderPending(query) {
        const template = this.templates.pending;
        this._resetLastSuggestion();
        template &&
          this.$el.html(
            template({
              query,
              dataset: this.name,
            })
          );
      },
      _renderNotFound: function renderNotFound(query) {
        const template = this.templates.notFound;
        this._resetLastSuggestion();
        template &&
          this.$el.html(
            template({
              query,
              dataset: this.name,
            })
          );
      },
      _empty: function empty() {
        this.$el.empty();
        this._resetLastSuggestion();
      },
      _getSuggestionsFragment: function getSuggestionsFragment(
        query,
        suggestions
      ) {
        const that = this;
        let fragment;
        fragment = document.createDocumentFragment();
        _.each(suggestions, function getSuggestionNode(suggestion) {
          let $el;
          let context;
          context = that._injectQuery(query, suggestion);
          $el = $(that.templates.suggestion(context))
            .data(keys.obj, suggestion)
            .data(keys.val, that.displayFn(suggestion))
            .addClass(`${that.classes.suggestion} ${that.classes.selectable}`);
          fragment.appendChild($el[0]);
        });
        this.highlight &&
          highlight({
            className: this.classes.highlight,
            node: fragment,
            pattern: query,
          });
        return $(fragment);
      },
      _getFooter: function getFooter(query, suggestions) {
        return this.templates.footer
          ? this.templates.footer({
              query,
              suggestions,
              dataset: this.name,
            })
          : null;
      },
      _getHeader: function getHeader(query, suggestions) {
        return this.templates.header
          ? this.templates.header({
              query,
              suggestions,
              dataset: this.name,
            })
          : null;
      },
      _resetLastSuggestion: function resetLastSuggestion() {
        this.$lastSuggestion = $();
      },
      _injectQuery: function injectQuery(query, obj) {
        return _.isObject(obj)
          ? _.mixin(
              {
                _query: query,
              },
              obj
            )
          : obj;
      },
      update: function update(query) {
        const that = this;
        let canceled = false;
        let syncCalled = false;
        let rendered = 0;
        this.cancel();
        this.cancel = function cancel() {
          canceled = true;
          that.cancel = $.noop;
          that.async && that.trigger("asyncCanceled", query);
        };
        this.source(query, sync, async);
        !syncCalled && sync([]);
        function sync(suggestions) {
          if (syncCalled) {
            return;
          }
          syncCalled = true;
          suggestions = (suggestions || []).slice(0, that.limit);
          rendered = suggestions.length;
          that._overwrite(query, suggestions);
          if (rendered < that.limit && that.async) {
            that.trigger("asyncRequested", query);
          }
        }
        function async(suggestions) {
          suggestions = suggestions || [];
          if (!canceled && rendered < that.limit) {
            that.cancel = $.noop;
            rendered += suggestions.length;
            that._append(query, suggestions.slice(0, that.limit - rendered));
            that.async && that.trigger("asyncReceived", query);
          }
        }
      },
      cancel: $.noop,
      clear: function clear() {
        this._empty();
        this.cancel();
        this.trigger("cleared");
      },
      isEmpty: function isEmpty() {
        return this.$el.is(":empty");
      },
      destroy: function destroy() {
        this.$el = $("<div>");
      },
    });
    return Dataset;
    function getDisplayFn(display) {
      display = display || _.stringify;
      return _.isFunction(display) ? display : displayFn;
      function displayFn(obj) {
        return obj[display];
      }
    }
    function getTemplates(templates, displayFn) {
      return {
        notFound: templates.notFound && _.templatify(templates.notFound),
        pending: templates.pending && _.templatify(templates.pending),
        header: templates.header && _.templatify(templates.header),
        footer: templates.footer && _.templatify(templates.footer),
        suggestion: templates.suggestion || suggestionTemplate,
      };
      function suggestionTemplate(context) {
        return $("<div>").text(displayFn(context));
      }
    }
    function isValidName(str) {
      return /^[_a-zA-Z0-9-]+$/.test(str);
    }
  })();
  const Menu = (function () {
    function Menu(o, www) {
      const that = this;
      o = o || {};
      if (!o.node) {
        $.error("node is required");
      }
      www.mixin(this);
      this.$node = $(o.node);
      this.query = null;
      this.datasets = _.map(o.datasets, initializeDataset);
      function initializeDataset(oDataset) {
        const node = that.$node.find(oDataset.node).first();
        oDataset.node = node.length ? node : $("<div>").appendTo(that.$node);
        return new Dataset(oDataset, www);
      }
    }
    _.mixin(Menu.prototype, EventEmitter, {
      _onSelectableClick: function onSelectableClick($e) {
        this.trigger("selectableClicked", $($e.currentTarget));
      },
      _onRendered: function onRendered(type, dataset, suggestions, async) {
        this.$node.toggleClass(this.classes.empty, this._allDatasetsEmpty());
        this.trigger("datasetRendered", dataset, suggestions, async);
      },
      _onCleared: function onCleared() {
        this.$node.toggleClass(this.classes.empty, this._allDatasetsEmpty());
        this.trigger("datasetCleared");
      },
      _propagate: function propagate() {
        this.trigger.apply(this, arguments);
      },
      _allDatasetsEmpty: function allDatasetsEmpty() {
        return _.every(this.datasets, isDatasetEmpty);
        function isDatasetEmpty(dataset) {
          return dataset.isEmpty();
        }
      },
      _getSelectables: function getSelectables() {
        return this.$node.find(this.selectors.selectable);
      },
      _removeCursor: function _removeCursor() {
        const $selectable = this.getActiveSelectable();
        $selectable && $selectable.removeClass(this.classes.cursor);
      },
      _ensureVisible: function ensureVisible($el) {
        let elTop;
        let elBottom;
        let nodeScrollTop;
        let nodeHeight;
        elTop = $el.position().top;
        elBottom = elTop + $el.outerHeight(true);
        nodeScrollTop = this.$node.scrollTop();
        nodeHeight =
          this.$node.height() +
          parseInt(this.$node.css("paddingTop"), 10) +
          parseInt(this.$node.css("paddingBottom"), 10);
        if (elTop < 0) {
          this.$node.scrollTop(nodeScrollTop + elTop);
        } else if (nodeHeight < elBottom) {
          this.$node.scrollTop(nodeScrollTop + (elBottom - nodeHeight));
        }
      },
      bind() {
        const that = this;
        let onSelectableClick;
        onSelectableClick = _.bind(this._onSelectableClick, this);
        this.$node.on("click.tt", this.selectors.selectable, onSelectableClick);
        _.each(this.datasets, function (dataset) {
          dataset
            .onSync("asyncRequested", that._propagate, that)
            .onSync("asyncCanceled", that._propagate, that)
            .onSync("asyncReceived", that._propagate, that)
            .onSync("rendered", that._onRendered, that)
            .onSync("cleared", that._onCleared, that);
        });
        return this;
      },
      isOpen: function isOpen() {
        return this.$node.hasClass(this.classes.open);
      },
      open: function open() {
        this.$node.addClass(this.classes.open);
      },
      close: function close() {
        this.$node.removeClass(this.classes.open);
        this._removeCursor();
      },
      setLanguageDirection: function setLanguageDirection(dir) {
        this.$node.attr("dir", dir);
      },
      selectableRelativeToCursor: function selectableRelativeToCursor(delta) {
        let $selectables;
        let $oldCursor;
        let oldIndex;
        let newIndex;
        $oldCursor = this.getActiveSelectable();
        $selectables = this._getSelectables();
        oldIndex = $oldCursor ? $selectables.index($oldCursor) : -1;
        newIndex = oldIndex + delta;
        newIndex = ((newIndex + 1) % ($selectables.length + 1)) - 1;
        newIndex = newIndex < -1 ? $selectables.length - 1 : newIndex;
        return newIndex === -1 ? null : $selectables.eq(newIndex);
      },
      setCursor: function setCursor($selectable) {
        this._removeCursor();
        if (($selectable = $selectable && $selectable.first())) {
          $selectable.addClass(this.classes.cursor);
          this._ensureVisible($selectable);
        }
      },
      getSelectableData: function getSelectableData($el) {
        return $el && $el.length ? Dataset.extractData($el) : null;
      },
      getActiveSelectable: function getActiveSelectable() {
        const $selectable = this._getSelectables()
          .filter(this.selectors.cursor)
          .first();
        return $selectable.length ? $selectable : null;
      },
      getTopSelectable: function getTopSelectable() {
        const $selectable = this._getSelectables().first();
        return $selectable.length ? $selectable : null;
      },
      update: function update(query) {
        const isValidUpdate = query !== this.query;
        if (isValidUpdate) {
          this.query = query;
          _.each(this.datasets, updateDataset);
        }
        return isValidUpdate;
        function updateDataset(dataset) {
          dataset.update(query);
        }
      },
      empty: function empty() {
        _.each(this.datasets, clearDataset);
        this.query = null;
        this.$node.addClass(this.classes.empty);
        function clearDataset(dataset) {
          dataset.clear();
        }
      },
      destroy: function destroy() {
        this.$node.off(".tt");
        this.$node = $("<div>");
        _.each(this.datasets, destroyDataset);
        function destroyDataset(dataset) {
          dataset.destroy();
        }
      },
    });
    return Menu;
  })();
  const DefaultMenu = (function () {
    const s = Menu.prototype;
    function DefaultMenu() {
      Menu.apply(this, [].slice.call(arguments, 0));
    }
    _.mixin(DefaultMenu.prototype, Menu.prototype, {
      open: function open() {
        !this._allDatasetsEmpty() && this._show();
        return s.open.apply(this, [].slice.call(arguments, 0));
      },
      close: function close() {
        this._hide();
        return s.close.apply(this, [].slice.call(arguments, 0));
      },
      _onRendered: function onRendered() {
        if (this._allDatasetsEmpty()) {
          this._hide();
        } else {
          this.isOpen() && this._show();
        }
        return s._onRendered.apply(this, [].slice.call(arguments, 0));
      },
      _onCleared: function onCleared() {
        if (this._allDatasetsEmpty()) {
          this._hide();
        } else {
          this.isOpen() && this._show();
        }
        return s._onCleared.apply(this, [].slice.call(arguments, 0));
      },
      setLanguageDirection: function setLanguageDirection(dir) {
        this.$node.css(dir === "ltr" ? this.css.ltr : this.css.rtl);
        return s.setLanguageDirection.apply(this, [].slice.call(arguments, 0));
      },
      _hide: function hide() {
        this.$node.hide();
      },
      _show: function show() {
        this.$node.css("display", "block");
      },
    });
    return DefaultMenu;
  })();
  const Typeahead = (function () {
    function Typeahead(o, www) {
      let onFocused;
      let onBlurred;
      let onEnterKeyed;
      let onTabKeyed;
      let onEscKeyed;
      let onUpKeyed;
      let onDownKeyed;
      let onLeftKeyed;
      let onRightKeyed;
      let onQueryChanged;
      let onWhitespaceChanged;
      o = o || {};
      if (!o.input) {
        $.error("missing input");
      }
      if (!o.menu) {
        $.error("missing menu");
      }
      if (!o.eventBus) {
        $.error("missing event bus");
      }
      www.mixin(this);
      this.eventBus = o.eventBus;
      this.minLength = _.isNumber(o.minLength) ? o.minLength : 1;
      this.input = o.input;
      this.menu = o.menu;
      this.enabled = true;
      this.active = false;
      this.input.hasFocus() && this.activate();
      this.dir = this.input.getLangDir();
      this._hacks();
      this.menu
        .bind()
        .onSync("selectableClicked", this._onSelectableClicked, this)
        .onSync("asyncRequested", this._onAsyncRequested, this)
        .onSync("asyncCanceled", this._onAsyncCanceled, this)
        .onSync("asyncReceived", this._onAsyncReceived, this)
        .onSync("datasetRendered", this._onDatasetRendered, this)
        .onSync("datasetCleared", this._onDatasetCleared, this);
      onFocused = c(this, "activate", "open", "_onFocused");
      onBlurred = c(this, "deactivate", "_onBlurred");
      onEnterKeyed = c(this, "isActive", "isOpen", "_onEnterKeyed");
      onTabKeyed = c(this, "isActive", "isOpen", "_onTabKeyed");
      onEscKeyed = c(this, "isActive", "_onEscKeyed");
      onUpKeyed = c(this, "isActive", "open", "_onUpKeyed");
      onDownKeyed = c(this, "isActive", "open", "_onDownKeyed");
      onLeftKeyed = c(this, "isActive", "isOpen", "_onLeftKeyed");
      onRightKeyed = c(this, "isActive", "isOpen", "_onRightKeyed");
      onQueryChanged = c(this, "_openIfActive", "_onQueryChanged");
      onWhitespaceChanged = c(this, "_openIfActive", "_onWhitespaceChanged");
      this.input
        .bind()
        .onSync("focused", onFocused, this)
        .onSync("blurred", onBlurred, this)
        .onSync("enterKeyed", onEnterKeyed, this)
        .onSync("tabKeyed", onTabKeyed, this)
        .onSync("escKeyed", onEscKeyed, this)
        .onSync("upKeyed", onUpKeyed, this)
        .onSync("downKeyed", onDownKeyed, this)
        .onSync("leftKeyed", onLeftKeyed, this)
        .onSync("rightKeyed", onRightKeyed, this)
        .onSync("queryChanged", onQueryChanged, this)
        .onSync("whitespaceChanged", onWhitespaceChanged, this)
        .onSync("langDirChanged", this._onLangDirChanged, this);
    }
    _.mixin(Typeahead.prototype, {
      _hacks: function hacks() {
        let $input;
        let $menu;
        $input = this.input.$input || $("<div>");
        $menu = this.menu.$node || $("<div>");
        $input.on("blur.tt", function ($e) {
          let active;
          let isActive;
          let hasActive;
          active = document.activeElement;
          isActive = $menu.is(active);
          hasActive = $menu.has(active).length > 0;
          if (_.isMsie() && (isActive || hasActive)) {
            $e.preventDefault();
            $e.stopImmediatePropagation();
            _.defer(function () {
              $input.focus();
            });
          }
        });
        $menu.on("mousedown.tt", function ($e) {
          $e.preventDefault();
        });
      },
      _onSelectableClicked: function onSelectableClicked(type, $el) {
        this.select($el);
      },
      _onDatasetCleared: function onDatasetCleared() {
        this._updateHint();
      },
      _onDatasetRendered: function onDatasetRendered(
        type,
        dataset,
        suggestions,
        async
      ) {
        this._updateHint();
        this.eventBus.trigger("render", suggestions, async, dataset);
      },
      _onAsyncRequested: function onAsyncRequested(type, dataset, query) {
        this.eventBus.trigger("asyncrequest", query, dataset);
      },
      _onAsyncCanceled: function onAsyncCanceled(type, dataset, query) {
        this.eventBus.trigger("asynccancel", query, dataset);
      },
      _onAsyncReceived: function onAsyncReceived(type, dataset, query) {
        this.eventBus.trigger("asyncreceive", query, dataset);
      },
      _onFocused: function onFocused() {
        this._minLengthMet() && this.menu.update(this.input.getQuery());
      },
      _onBlurred: function onBlurred() {
        if (this.input.hasQueryChangedSinceLastFocus()) {
          this.eventBus.trigger("change", this.input.getQuery());
        }
      },
      _onEnterKeyed: function onEnterKeyed(type, $e) {
        let $selectable;
        if (($selectable = this.menu.getActiveSelectable())) {
          this.select($selectable) && $e.preventDefault();
        }
      },
      _onTabKeyed: function onTabKeyed(type, $e) {
        let $selectable;
        if (($selectable = this.menu.getActiveSelectable())) {
          this.select($selectable) && $e.preventDefault();
        } else if (($selectable = this.menu.getTopSelectable())) {
          this.autocomplete($selectable) && $e.preventDefault();
        }
      },
      _onEscKeyed: function onEscKeyed() {
        this.close();
      },
      _onUpKeyed: function onUpKeyed() {
        this.moveCursor(-1);
      },
      _onDownKeyed: function onDownKeyed() {
        this.moveCursor(+1);
      },
      _onLeftKeyed: function onLeftKeyed() {
        if (this.dir === "rtl" && this.input.isCursorAtEnd()) {
          this.autocomplete(this.menu.getTopSelectable());
        }
      },
      _onRightKeyed: function onRightKeyed() {
        if (this.dir === "ltr" && this.input.isCursorAtEnd()) {
          this.autocomplete(this.menu.getTopSelectable());
        }
      },
      _onQueryChanged: function onQueryChanged(e, query) {
        this._minLengthMet(query) ? this.menu.update(query) : this.menu.empty();
      },
      _onWhitespaceChanged: function onWhitespaceChanged() {
        this._updateHint();
      },
      _onLangDirChanged: function onLangDirChanged(e, dir) {
        if (this.dir !== dir) {
          this.dir = dir;
          this.menu.setLanguageDirection(dir);
        }
      },
      _openIfActive: function openIfActive() {
        this.isActive() && this.open();
      },
      _minLengthMet: function minLengthMet(query) {
        query = _.isString(query) ? query : this.input.getQuery() || "";
        return query.length >= this.minLength;
      },
      _updateHint: function updateHint() {
        let $selectable;
        let data;
        let val;
        let query;
        let escapedQuery;
        let frontMatchRegEx;
        let match;
        $selectable = this.menu.getTopSelectable();
        data = this.menu.getSelectableData($selectable);
        val = this.input.getInputValue();
        if (data && !_.isBlankString(val) && !this.input.hasOverflow()) {
          query = Input.normalizeQuery(val);
          escapedQuery = _.escapeRegExChars(query);
          frontMatchRegEx = new RegExp(`^(?:${escapedQuery})(.+$)`, "i");
          match = frontMatchRegEx.exec(data.val);
          match && this.input.setHint(val + match[1]);
        } else {
          this.input.clearHint();
        }
      },
      isEnabled: function isEnabled() {
        return this.enabled;
      },
      enable: function enable() {
        this.enabled = true;
      },
      disable: function disable() {
        this.enabled = false;
      },
      isActive: function isActive() {
        return this.active;
      },
      activate: function activate() {
        if (this.isActive()) {
          return true;
        }
        if (!this.isEnabled() || this.eventBus.before("active")) {
          return false;
        }
        this.active = true;
        this.eventBus.trigger("active");
        return true;
      },
      deactivate: function deactivate() {
        if (!this.isActive()) {
          return true;
        }
        if (this.eventBus.before("idle")) {
          return false;
        }
        this.active = false;
        this.close();
        this.eventBus.trigger("idle");
        return true;
      },
      isOpen: function isOpen() {
        return this.menu.isOpen();
      },
      open: function open() {
        if (!this.isOpen() && !this.eventBus.before("open")) {
          this.menu.open();
          this._updateHint();
          this.eventBus.trigger("open");
        }
        return this.isOpen();
      },
      close: function close() {
        if (this.isOpen() && !this.eventBus.before("close")) {
          this.menu.close();
          this.input.clearHint();
          this.input.resetInputValue();
          this.eventBus.trigger("close");
        }
        return !this.isOpen();
      },
      setVal: function setVal(val) {
        this.input.setQuery(_.toStr(val));
      },
      getVal: function getVal() {
        return this.input.getQuery();
      },
      select: function select($selectable) {
        const data = this.menu.getSelectableData($selectable);
        if (data && !this.eventBus.before("select", data.obj)) {
          this.input.setQuery(data.val, true);
          this.eventBus.trigger("select", data.obj);
          this.close();
          return true;
        }
        return false;
      },
      autocomplete: function autocomplete($selectable) {
        let query;
        let data;
        let isValid;
        query = this.input.getQuery();
        data = this.menu.getSelectableData($selectable);
        isValid = data && query !== data.val;
        if (isValid && !this.eventBus.before("autocomplete", data.obj)) {
          this.input.setQuery(data.val);
          this.eventBus.trigger("autocomplete", data.obj);
          return true;
        }
        return false;
      },
      moveCursor: function moveCursor(delta) {
        let query;
        let $candidate;
        let data;
        let payload;
        let cancelMove;
        query = this.input.getQuery();
        $candidate = this.menu.selectableRelativeToCursor(delta);
        data = this.menu.getSelectableData($candidate);
        payload = data ? data.obj : null;
        cancelMove = this._minLengthMet() && this.menu.update(query);
        if (!cancelMove && !this.eventBus.before("cursorchange", payload)) {
          this.menu.setCursor($candidate);
          if (data) {
            this.input.setInputValue(data.val);
          } else {
            this.input.resetInputValue();
            this._updateHint();
          }
          this.eventBus.trigger("cursorchange", payload);
          return true;
        }
        return false;
      },
      destroy: function destroy() {
        this.input.destroy();
        this.menu.destroy();
      },
    });
    return Typeahead;
    function c(ctx) {
      const methods = [].slice.call(arguments, 1);
      return function () {
        const args = [].slice.call(arguments);
        _.each(methods, function (method) {
          return ctx[method].apply(ctx, args);
        });
      };
    }
  })();
  (function () {
    let old;
    let keys;
    let methods;
    old = $.fn.typeahead;
    keys = {
      www: "tt-www",
      attrs: "tt-attrs",
      typeahead: "tt-typeahead",
    };
    methods = {
      initialize: function initialize(o, datasets) {
        let www;
        datasets = _.isArray(datasets) ? datasets : [].slice.call(arguments, 1);
        o = o || {};
        www = WWW(o.classNames);
        return this.each(attach);
        function attach() {
          let $input;
          let $wrapper;
          let $hint;
          let $menu;
          let defaultHint;
          let defaultMenu;
          let eventBus;
          let input;
          let menu;
          let typeahead;
          let MenuConstructor;
          _.each(datasets, function (d) {
            d.highlight = !!o.highlight;
          });
          $input = $(this);
          $wrapper = $(www.html.wrapper);
          $hint = $elOrNull(o.hint);
          $menu = $elOrNull(o.menu);
          defaultHint = o.hint !== false && !$hint;
          defaultMenu = o.menu !== false && !$menu;
          defaultHint && ($hint = buildHintFromInput($input, www));
          defaultMenu && ($menu = $(www.html.menu).css(www.css.menu));
          $hint && $hint.val("");
          $input = prepInput($input, www);
          if (defaultHint || defaultMenu) {
            $wrapper.css(www.css.wrapper);
            $input.css(defaultHint ? www.css.input : www.css.inputWithNoHint);
            $input
              .wrap($wrapper)
              .parent()
              .prepend(defaultHint ? $hint : null)
              .append(defaultMenu ? $menu : null);
          }
          MenuConstructor = defaultMenu ? DefaultMenu : Menu;
          eventBus = new EventBus({
            el: $input,
          });
          input = new Input(
            {
              hint: $hint,
              input: $input,
            },
            www
          );
          menu = new MenuConstructor(
            {
              node: $menu,
              datasets,
            },
            www
          );
          typeahead = new Typeahead(
            {
              input,
              menu,
              eventBus,
              minLength: o.minLength,
            },
            www
          );
          $input.data(keys.www, www);
          $input.data(keys.typeahead, typeahead);
        }
      },
      isEnabled: function isEnabled() {
        let enabled;
        ttEach(this.first(), function (t) {
          enabled = t.isEnabled();
        });
        return enabled;
      },
      enable: function enable() {
        ttEach(this, function (t) {
          t.enable();
        });
        return this;
      },
      disable: function disable() {
        ttEach(this, function (t) {
          t.disable();
        });
        return this;
      },
      isActive: function isActive() {
        let active;
        ttEach(this.first(), function (t) {
          active = t.isActive();
        });
        return active;
      },
      activate: function activate() {
        ttEach(this, function (t) {
          t.activate();
        });
        return this;
      },
      deactivate: function deactivate() {
        ttEach(this, function (t) {
          t.deactivate();
        });
        return this;
      },
      isOpen: function isOpen() {
        let open;
        ttEach(this.first(), function (t) {
          open = t.isOpen();
        });
        return open;
      },
      open: function open() {
        ttEach(this, function (t) {
          t.open();
        });
        return this;
      },
      close: function close() {
        ttEach(this, function (t) {
          t.close();
        });
        return this;
      },
      select: function select(el) {
        let success = false;
        const $el = $(el);
        ttEach(this.first(), function (t) {
          success = t.select($el);
        });
        return success;
      },
      autocomplete: function autocomplete(el) {
        let success = false;
        const $el = $(el);
        ttEach(this.first(), function (t) {
          success = t.autocomplete($el);
        });
        return success;
      },
      moveCursor: function moveCursoe(delta) {
        let success = false;
        ttEach(this.first(), function (t) {
          success = t.moveCursor(delta);
        });
        return success;
      },
      val: function val(newVal) {
        let query;
        if (!arguments.length) {
          ttEach(this.first(), function (t) {
            query = t.getVal();
          });
          return query;
        }
        ttEach(this, function (t) {
          t.setVal(newVal);
        });
        return this;
      },
      destroy: function destroy() {
        ttEach(this, function (typeahead, $input) {
          revert($input);
          typeahead.destroy();
        });
        return this;
      },
    };
    $.fn.typeahead = function (method) {
      if (methods[method]) {
        return methods[method].apply(this, [].slice.call(arguments, 1));
      }
      return methods.initialize.apply(this, arguments);
    };
    $.fn.typeahead.noConflict = function noConflict() {
      $.fn.typeahead = old;
      return this;
    };
    function ttEach($els, fn) {
      $els.each(function () {
        const $input = $(this);
        let typeahead;
        (typeahead = $input.data(keys.typeahead)) && fn(typeahead, $input);
      });
    }
    function buildHintFromInput($input, www) {
      return $input
        .clone()
        .addClass(www.classes.hint)
        .removeData()
        .css(www.css.hint)
        .css(getBackgroundStyles($input))
        .prop("readonly", true)
        .removeAttr("id name placeholder required")
        .attr({
          autocomplete: "off",
          spellcheck: "false",
          tabindex: -1,
        });
    }
    function prepInput($input, www) {
      $input.data(keys.attrs, {
        dir: $input.attr("dir"),
        autocomplete: $input.attr("autocomplete"),
        spellcheck: $input.attr("spellcheck"),
        style: $input.attr("style"),
      });
      $input.addClass(www.classes.input).attr({
        autocomplete: "off",
        spellcheck: false,
      });
      try {
        !$input.attr("dir") && $input.attr("dir", "auto");
      } catch (e) {}
      return $input;
    }
    function getBackgroundStyles($el) {
      return {
        backgroundAttachment: $el.css("background-attachment"),
        backgroundClip: $el.css("background-clip"),
        backgroundColor: $el.css("background-color"),
        backgroundImage: $el.css("background-image"),
        backgroundOrigin: $el.css("background-origin"),
        backgroundPosition: $el.css("background-position"),
        backgroundRepeat: $el.css("background-repeat"),
        backgroundSize: $el.css("background-size"),
      };
    }
    function revert($input) {
      let www;
      let $wrapper;
      www = $input.data(keys.www);
      $wrapper = $input.parent().filter(www.selectors.wrapper);
      _.each($input.data(keys.attrs), function (val, key) {
        _.isUndefined(val) ? $input.removeAttr(key) : $input.attr(key, val);
      });
      $input
        .removeData(keys.typeahead)
        .removeData(keys.www)
        .removeData(keys.attr)
        .removeClass(www.classes.input);
      if ($wrapper.length) {
        $input.detach().insertAfter($wrapper);
        $wrapper.remove();
      }
    }
    function $elOrNull(obj) {
      let isValid;
      let $el;
      isValid = _.isJQuery(obj) || _.isElement(obj);
      $el = isValid ? $(obj).first() : [];
      return $el.length ? $el : null;
    }
  })();
});
