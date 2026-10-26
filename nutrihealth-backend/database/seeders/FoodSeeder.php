<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Food;

class FoodSeeder extends Seeder
{
    public function run(): void
    {
        $foods = [
            [
                'name' => 'Nasi Putih',
                'category' => 'Makanan Pokok',
                'serving_size' => 100,
                'serving_unit' => 'gram',
                'calories' => 130,
                'protein' => 2.7,
                'carbohydrates' => 28.2,
                'fat' => 0.3,
                'sugar' => 0.1,
                'sodium' => 1,
            ],
            [
                'name' => 'Nasi Goreng',
                'category' => 'Makanan',
                'serving_size' => 200,
                'serving_unit' => 'gram',
                'calories' => 333,
                'protein' => 8,
                'carbohydrates' => 45,
                'fat' => 12,
                'sugar' => 3,
                'sodium' => 700,
            ],
            [
                'name' => 'Telur Rebus',
                'category' => 'Lauk',
                'serving_size' => 50,
                'serving_unit' => 'gram',
                'calories' => 78,
                'protein' => 6.3,
                'carbohydrates' => 0.6,
                'fat' => 5.3,
                'sugar' => 0.6,
                'sodium' => 62,
            ],
            [
                'name' => 'Dada Ayam Panggang',
                'category' => 'Lauk',
                'serving_size' => 100,
                'serving_unit' => 'gram',
                'calories' => 165,
                'protein' => 31,
                'carbohydrates' => 0,
                'fat' => 3.6,
                'sugar' => 0,
                'sodium' => 74,
            ],
            [
                'name' => 'Pisang',
                'category' => 'Buah',
                'serving_size' => 100,
                'serving_unit' => 'gram',
                'calories' => 89,
                'protein' => 1.1,
                'carbohydrates' => 22.8,
                'fat' => 0.3,
                'sugar' => 12.2,
                'sodium' => 1,
            ],
            [
                'name' => 'Teh Manis',
                'category' => 'Minuman',
                'serving_size' => 250,
                'serving_unit' => 'ml',
                'calories' => 80,
                'protein' => 0,
                'carbohydrates' => 20,
                'fat' => 0,
                'sugar' => 20,
                'sodium' => 5,
            ],
        ];

        foreach ($foods as $food) {
            Food::updateOrCreate(
                ['name' => $food['name']],
                $food
            );
        }
    }
}
