<?php

/*
 * Copyright (c) 2011 David Gwynne <dlg@uq.edu.au>
 *  - original author
 * Copyright (c) 2014 Alex Wilson <alex@uq.edu.au>
 *  - add kv_op_update and relax requirement for alphanumeric keys
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

define('KV_OP_CREATE', 0);
define('KV_OP_CREATED', 1);
define('KV_OP_REQUEST', 2);
define('KV_OP_VALUE', 3);
define('KV_OP_NOVALUE', 4);
define('KV_OP_DELETE', 5);
define('KV_OP_DELETED', 6);
define('KV_OP_SYNC', 7);
define('KV_OP_UPDATE', 10);
define('KV_OP_UPDATED', 11);

define('KV_PORT', '1080');

$_kv_timeout = array('sec' => 0, 'usec' => 250000);
$_kv_retries = 10;

function kv_cookie()
{
	$possible = "0123456789";
	$possible .= "abcdefghijlkmnopqrstuvwxyz";
	$possible .= "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	$str = "";
	for ($i = 0; $i < 32; $i++) {
		$str .= substr($possible, mt_rand(0, strlen($possible)-1), 1);
	}
	return ($str);
}

function kv_update($key, $payload, $host, $port = KV_PORT)
{
	global $_kv_timeout;
	global $_kv_retries;

	$s = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
	if (!$s) {
		return (false);
	}

	$request = pack('CxnA32a*', KV_OP_UPDATE, strlen($payload), $key, $payload);
	$retries = $_kv_retries;
	do {
		if (!socket_sendto($s, $request, strlen($request), 0, $host, $port)) {
			continue;
		}
		$r = array($s);
		$w = NULL;
		$e = NULL;
		$n = socket_select($r, $w, $e, $_kv_timeout['sec'], $_kv_timeout['usec']);
		if ($n === false || $n == 0) {
			continue;
		}
		if (!@socket_recvfrom($s, $reply, 4 + 32, 0, $host, $port)) {
			continue;
		}
		if (strlen($reply) != 4 + 32) {
			continue;
		}
		$bits = unpack('Copcode/x_pad/nlen/A32key', $reply);
		if ($bits['opcode'] != KV_OP_UPDATED || $bits['key'] != $key) {
			continue;
		}

		return (true);
	} while (--$retries);

	return (false);
}

function kv_put($payload, $host, $port = KV_PORT)
{
	global $_kv_timeout;
	global $_kv_retries;

	$s = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
	if (!$s) {
		return (false);
	}

	$cookie = kv_cookie();
	$request = pack('CxnA32a*', KV_OP_CREATE, strlen($payload), $cookie, $payload);
	$retries = $_kv_retries;
	do {
		if (!socket_sendto($s, $request, strlen($request), 0, $host, $port)) {
			continue;
		}
		$r = array($s);
		$w = NULL;
		$e = NULL;
		$n = socket_select($r, $w, $e, $_kv_timeout['sec'], $_kv_timeout['usec']);
		if ($n === false || $n == 0) {
			continue;
		}
		if (!@socket_recvfrom($s, $reply, 4 + 32 + 32, 0, $host, $port)) {
			continue;
		}
		if (strlen($reply) != 4 + 32 + 32) {
			continue;
		}
		$bits = unpack('Copcode/x_pad/nlen/A32cookie/A32key', $reply);
		if ($bits['opcode'] != KV_OP_CREATED || $bits['cookie'] != $cookie) {
			continue;
		}

		return ($bits['key']);
	} while (--$retries);

	return (false);
}

function kv_get($key, $host, $port = KV_PORT)
{
	global $_kv_timeout;
	global $_kv_retries;

	$s = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
	if (!$s) {
		return (false);
	}

	$request = pack('CxnA32', KV_OP_REQUEST, 0, $key);
	$retries = $_kv_retries;
	do {
		if (!socket_sendto($s, $request, strlen($request), 0, $host, $port)) {
			continue;
		}
		$r = array($s);
		$w = NULL;
		$e = NULL;
		$n = socket_select($r, $w, $e, $_kv_timeout['sec'], $_kv_timeout['usec']);
		if ($n === false || $n == 0) {
			continue;
		}
		if (!@socket_recvfrom($s, $reply, 65536, 0, $host, $port)) {
			continue;
		}
		if (strlen($reply) < 4 + 32) {
			continue;
		}
		$bits = unpack('Copcode/x_pad/nlen/A32key', $reply);
		if ($bits['key'] != $key) {
			continue;
		}
		if ($bits['opcode'] == KV_OP_NOVALUE) {
			return (false);
		}
		if ($bits['opcode'] != KV_OP_VALUE) {
			continue;
		}
		$bits = unpack('Copcode/x_pad/nlen/A32key/a*payload', $reply);
		if ($bits['len'] != strlen($bits['payload'])) {
			continue;
		}

		return ($bits['payload']);
	} while (--$retries);

	return (false);
}

function kv_get_bucket($key, $bucket, $host, $port = KV_PORT)
{
	global $_kv_timeout;
	global $_kv_retries;

	$s = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
	if (!$s) {
		return (false);
	}

	$request = pack('CxnA32a*', KV_OP_REQUEST, strlen($bucket), $key, $bucket);
	$retries = $_kv_retries;
	do {
		if (!socket_sendto($s, $request, strlen($request), 0, $host, $port)) {
			continue;
		}
		$r = array($s);
		$w = NULL;
		$e = NULL;
		$n = socket_select($r, $w, $e, $_kv_timeout['sec'], $_kv_timeout['usec']);
		if ($n === false || $n == 0) {
			continue;
		}
		if (!@socket_recvfrom($s, $reply, 65536, 0, $host, $port)) {
			continue;
		}
		if (strlen($reply) < 4 + 32) {
			continue;
		}
		$bits = unpack('Copcode/x_pad/nlen/A32key', $reply);
		if ($bits['key'] != $key) {
			continue;
		}
		if ($bits['opcode'] == KV_OP_NOVALUE) {
			return (false);
		}
		if ($bits['opcode'] != KV_OP_VALUE) {
			continue;
		}
		$bits = unpack('Copcode/x_pad/nlen/A32key/a*payload', $reply);
		if ($bits['len'] != strlen($bits['payload'])) {
			continue;
		}

		return ($bits['payload']);
	} while (--$retries);

	return (false);
}

function kv_rm($key, $host, $port = KV_PORT)
{
	global $_kv_timeout;
	global $_kv_retries;

	$s = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
	if (!$s) {
		return (false);
	}

	$request = pack('CxnA32', KV_OP_DELETE, 0, $key);
	$retries = $_kv_retries;
	do {
		if (!socket_sendto($s, $request, strlen($request), 0, $host, $port)) {
			continue;
		}
		$r = array($s);
		$w = NULL;
		$e = NULL;
		$n = socket_select($r, $w, $e, $_kv_timeout['sec'], $_kv_timeout['usec']);
		if ($n === false || $n == 0) {
			continue;
		}
		if (!@socket_recvfrom($s, $reply, 65536, 0, $host, $port)) {
			continue;
		}
		if (strlen($reply) < 4 + 32) {
			continue;
		}
		$bits = unpack('Copcode/x_pad/nlen/A32key', $reply);
		if ($bits['opcode'] != KV_OP_DELETED) {
			continue;
		}
		if ($bits['key'] != $key) {
			continue;
		}

		return (true);
	} while (--$retries);

	return (false);
}

?>
