<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Food;
use Illuminate\Http\JsonResponse;

class FoodController extends Controller
{
    public function index(): JsonResponse
    {
        $foods = Food::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'message' => 'Data makanan berhasil diambil.',
            'data' => $foods,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $food = Food::find($id);

        if (!$food) {
            return response()->json([
                'success' => false,
                'message' => 'Data makanan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $food,
        ]);
    }
}
