<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FoodController;

Route::get('/foods', [FoodController::class, 'index']);
Route::get('/foods/{id}', [FoodController::class, 'show']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('guest');
Route::get('/me', [AuthController::class, 'me'])
    ->middleware('auth:sanctum');
Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth:sanctum');
